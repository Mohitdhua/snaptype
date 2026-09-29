import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { extractTextFromImage } from '../services/geminiService';
import {
  getSpellingMisspeltPool,
  addWordsToSpellingMisspeltPool,
  exportSpellingMisspeltPoolTxt,
  clearSpellingMisspeltPool
} from '../services/storageService';
import { SpellingWordResult } from '../types';

interface SpellingQuizViewProps {
  theme?: 'dark' | 'light';
  onBackToHome?: () => void;
}

const DEFAULT_SAMPLE_WORDS = [
  'rhythm', 'accommodation', 'mischievous', 'embarrass', 'occurrence',
  'conscientious', 'pronunciation', 'maintenance', 'necessary', 'privilege'
];

type QuizPhase = 'SETUP' | 'PLAYING' | 'RESULTS';

export const SpellingQuizView: React.FC<SpellingQuizViewProps> = ({
  theme = 'dark',
  onBackToHome
}) => {
  // Phase state
  const [phase, setPhase] = useState<QuizPhase>('SETUP');

  // Words & Settings
  const [words, setWords] = useState<string[]>([]);
  const [secondsPerWord, setSecondsPerWord] = useState<number>(7);
  const [showSettings, setShowSettings] = useState(false);

  // Input / Setup state
  const [inputText, setInputText] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [misspeltPool, setMisspeltPool] = useState<string[]>(() => getSpellingMisspeltPool());

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [results, setResults] = useState<SpellingWordResult[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(7);
  const [feedbackStatus, setFeedbackStatus] = useState<'none' | 'correct' | 'incorrect'>('none');

  // Timers & Audio
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordStartTimeRef = useRef<number>(Date.now());
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Sync misspelt pool
  const refreshPool = () => {
    setMisspeltPool(getSpellingMisspeltPool());
  };

  // Speech synthesis helper
  const speakWord = useCallback((wordToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(wordToSpeak);
    utterance.rate = 0.9; // slightly clearer pace for spelling
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, []);

  // Parse raw text or file input into clean words
  const extractWordsFromText = (raw: string): string[] => {
    return raw
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 2);
  };

  // Start Quiz with a word list
  const startQuiz = (wordList: string[]) => {
    const cleanList = wordList.map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
    if (cleanList.length === 0) {
      alert('Please provide at least one valid word to start the spelling quiz.');
      return;
    }
    setWords(cleanList);
    setCurrentIndex(0);
    setResults([]);
    setTypedLetters([]);
    setFeedbackStatus('none');
    setPhase('PLAYING');
  };

  // Initialize word step
  useEffect(() => {
    if (phase !== 'PLAYING' || words.length === 0) return;

    if (currentIndex >= words.length) {
      // Quiz complete
      finishQuiz();
      return;
    }

    const currentWord = words[currentIndex];
    setTypedLetters([]);
    setFeedbackStatus('none');
    setTimeLeft(secondsPerWord);
    wordStartTimeRef.current = Date.now();

    // Speak word
    speakWord(currentWord);

    // Focus input container for keyboard events
    if (inputContainerRef.current) {
      inputContainerRef.current.focus();
    }
  }, [currentIndex, phase, words, secondsPerWord, speakWord]);

  // Countdown timer per word
  useEffect(() => {
    if (phase !== 'PLAYING' || feedbackStatus !== 'none') return;

    if (timeLeft <= 0) {
      // Time expired! Mark word as incorrect
      handleWordComplete(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, phase, feedbackStatus]);

  // Finish Quiz and save incorrect words to pool
  const finishQuiz = () => {
    setPhase('RESULTS');
  };

  useEffect(() => {
    if (phase === 'RESULTS' && results.length > 0) {
      const incorrectWords = results.filter(r => !r.isCorrect).map(r => r.expected);
      if (incorrectWords.length > 0) {
        addWordsToSpellingMisspeltPool(incorrectWords);
        refreshPool();
      }
    }
  }, [phase, results]);

  // Handle auto-complete when word is finished or time expires
  const handleWordComplete = useCallback((overrideSuccess?: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const currentWord = words[currentIndex] || '';
    const typedWord = typedLetters.join('').toLowerCase();
    const timeSpent = Math.round((Date.now() - wordStartTimeRef.current) / 1000);

    const isCorrect = overrideSuccess !== undefined
      ? overrideSuccess
      : (typedWord === currentWord.toLowerCase());

    setFeedbackStatus(isCorrect ? 'correct' : 'incorrect');

    const newResult: SpellingWordResult = {
      expected: currentWord,
      typed: typedWord,
      isCorrect,
      timeSpent
    };

    setResults(prev => [...prev, newResult]);

    // Delay briefly for animation feedback then advance
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 350);
  }, [words, currentIndex, typedLetters]);

  // Process key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (phase !== 'PLAYING' || feedbackStatus !== 'none') return;

    const currentWord = words[currentIndex];
    if (!currentWord) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      setTypedLetters(prev => prev.slice(0, -1));
      return;
    }

    // Shortcut to repeat audio
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      speakWord(currentWord);
      return;
    }

    // Only accept single alphabetic characters
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const nextLetter = e.key.toLowerCase();
      const updatedLetters = [...typedLetters, nextLetter];

      if (updatedLetters.length <= currentWord.length) {
        setTypedLetters(updatedLetters);

        // Auto-advance as soon as final box is typed!
        if (updatedLetters.length === currentWord.length) {
          const typedWord = updatedLetters.join('').toLowerCase();
          const isCorrect = typedWord === currentWord.toLowerCase();

          if (timerRef.current) clearTimeout(timerRef.current);
          setFeedbackStatus(isCorrect ? 'correct' : 'incorrect');

          const timeSpent = Math.round((Date.now() - wordStartTimeRef.current) / 1000);
          setResults(prev => [
            ...prev,
            {
              expected: currentWord,
              typed: typedWord,
              isCorrect,
              timeSpent
            }
          ]);

          setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
          }, 350);
        }
      }
    }
  };

  // Image upload OCR handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        const extracted = await extractTextFromImage(base64, file.type || 'image/jpeg');
        const extractedWords = extractWordsFromText(extracted);
        if (extractedWords.length === 0) {
          alert('No valid words found in image. Please try another image.');
        } else {
          startQuiz(extractedWords);
        }
        setIsOcrProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert('Error reading image for spelling words.');
      setIsOcrProcessing(false);
    }
  };

  // TXT File upload handler
  const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const extractedWords = extractWordsFromText(text);
      if (extractedWords.length === 0) {
        alert('No valid words found in file.');
      } else {
        startQuiz(extractedWords);
      }
    };
    reader.readAsText(file);
  };

  // RENDER PHASE: SETUP
  if (phase === 'SETUP') {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in text-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-stitch-accent flex items-center gap-3">
              <span>🗣️</span> Audio Spelling Quiz
            </h1>
            <p className="text-sm text-stitch-muted mt-1">
              Listen to each word, type into letter boxes, and test your spelling precision!
            </p>
          </div>

          {/* Settings Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xl"
            title="Spelling Quiz Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#131924] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-up">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>⚙️</span> Quiz Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-neutral-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-neutral-300">
                      Time limit per word
                    </label>
                    <span className="text-indigo-400 font-mono font-bold text-base">
                      {secondsPerWord}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={10}
                    step={1}
                    value={secondsPerWord}
                    onChange={e => setSecondsPerWord(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                    <span>5 sec (Fast)</span>
                    <span>10 sec (Relaxed)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <Button onClick={() => setShowSettings(false)}>
                    Save & Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Options Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Card 1: OCR Book Image */}
          <div className="bento-card p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
            <div>
              <div className="text-3xl mb-3">📸</div>
              <h3 className="text-lg font-bold text-white mb-1">Upload Book Image (AI OCR)</h3>
              <p className="text-xs text-stitch-muted mb-4">
                Snap or upload a picture of a book page. AI extracts words into spelling questions automatically.
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isOcrProcessing}
                className="hidden"
              />
              <div className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm text-center transition-all ${
                isOcrProcessing
                  ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}>
                {isOcrProcessing ? 'Reading Image with AI...' : '📷 Choose Image'}
              </div>
            </label>
          </div>

          {/* Card 2: Custom Text / File Upload */}
          <div className="bento-card p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
            <div>
              <div className="text-3xl mb-3">📄</div>
              <h3 className="text-lg font-bold text-white mb-1">Custom Text or .TXT File</h3>
              <p className="text-xs text-stitch-muted mb-4">
                Paste your word list below or upload a .txt file to create a custom spelling test.
              </p>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type or paste words here (e.g. rhythm, accommodate, foreign...)"
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              />
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer flex-1">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleTxtFileUpload}
                  className="hidden"
                />
                <div className="w-full py-2 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-center text-neutral-300">
                  📁 .TXT File
                </div>
              </label>
              <button
                type="button"
                onClick={() => startQuiz(extractWordsFromText(inputText))}
                disabled={!inputText.trim()}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white shadow-md"
              >
                Start Custom
              </button>
            </div>
          </div>

          {/* Card 3: Saved Misspelt Pool */}
          <div className="bento-card p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
            <div>
              <div className="flex justify-between items-start">
                <div className="text-3xl mb-3">🎯</div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {misspeltPool.length} Words Stored
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Misspelt Words Vault</h3>
              <p className="text-xs text-stitch-muted mb-4">
                All incorrectly typed words are saved here automatically. Practice your error pool until perfection!
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startQuiz(misspeltPool)}
                disabled={misspeltPool.length === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white shadow-md"
              >
                Practice Misspelt Pool
              </button>
              {misspeltPool.length > 0 && (
                <button
                  type="button"
                  onClick={exportSpellingMisspeltPoolTxt}
                  className="py-2.5 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-neutral-300"
                  title="Export misspelt words as text file"
                >
                  📥 Export
                </button>
              )}
            </div>
          </div>

          {/* Card 4: Default Sample Practice */}
          <div className="bento-card p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all">
            <div>
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-white mb-1">Quick Sample Quiz</h3>
              <p className="text-xs text-stitch-muted mb-4">
                Test yourself instantly with 10 commonly misspelled English words.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {DEFAULT_SAMPLE_WORDS.slice(0, 5).map(w => (
                  <span key={w} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                    {w}
                  </span>
                ))}
                <span className="text-[10px] text-neutral-500 font-mono self-center">+5 more</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startQuiz(DEFAULT_SAMPLE_WORDS)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shadow-md border border-white/10"
            >
              Start Quick Quiz
            </button>
          </div>

        </div>
      </div>
    );
  }

  // RENDER PHASE: PLAYING
  if (phase === 'PLAYING') {
    const currentWord = words[currentIndex] || '';
    const wordLength = currentWord.length;

    return (
      <div
        ref={inputContainerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="w-full max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center focus:outline-none select-none animate-fade-in"
      >
        {/* Top Header & Progress */}
        <div className="w-full flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Word {currentIndex + 1} of {words.length}
            </span>
            <span className="text-xs text-stitch-muted font-mono hidden sm:inline">
              Timer: {secondsPerWord}s per word
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPhase('SETUP')}
            className="text-xs font-semibold text-neutral-400 hover:text-white px-3 py-1 rounded-lg border border-white/10 bg-white/5"
          >
            Exit Quiz
          </button>
        </div>

        {/* Audio Speaker Box */}
        <div className="bento-card w-full p-8 md:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-2xl">

          {/* Progress Timer Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className={`h-full transition-all duration-1000 linear ${
                timeLeft <= 2 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(timeLeft / secondsPerWord) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => speakWord(currentWord)}
              className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
              title="Click or press Space/Enter to replay audio"
            >
              🔊
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 mb-2">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-bold">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-bold">Enter</kbd> to replay audio</span>
          </div>

          <div className="text-2xl font-mono font-black text-white">
            {timeLeft}s
          </div>
        </div>

        {/* Letter Boxes Container */}
        <div className="flex flex-col items-center justify-center w-full mb-8">
          <div className={`flex flex-wrap items-center justify-center gap-2 md:gap-3 p-4 rounded-3xl transition-all ${
            feedbackStatus === 'correct'
              ? 'ring-4 ring-emerald-500/80 bg-emerald-950/20'
              : feedbackStatus === 'incorrect'
              ? 'ring-4 ring-rose-500/80 bg-rose-950/20'
              : ''
          }`}>
            {Array.from({ length: wordLength }).map((_, idx) => {
              const letter = typedLetters[idx] || '';
              const isCurrent = idx === typedLetters.length && feedbackStatus === 'none';

              return (
                <div
                  key={idx}
                  className={`w-12 h-14 md:w-16 md:h-20 rounded-2xl border-2 flex items-center justify-center text-2xl md:text-3xl font-black font-mono uppercase transition-all shadow-md ${
                    letter
                      ? 'border-indigo-500/80 bg-indigo-950/40 text-white scale-100'
                      : isCurrent
                      ? 'border-indigo-400 bg-white/10 text-white animate-pulse'
                      : 'border-white/10 bg-slate-900/60 text-transparent'
                  }`}
                >
                  {letter}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-stitch-muted mt-4 font-mono">
            Type each letter into the boxes. Advances automatically on the last box!
          </p>
        </div>
      </div>
    );
  }

  // RENDER PHASE: RESULTS
  const totalCount = results.length;
  const correctCount = results.filter(r => r.isCorrect).length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const misspeltResults = results.filter(r => !r.isCorrect);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 animate-fade-in text-slate-100">

      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-stitch-accent">
          Spelling Quiz Completed!
        </h1>
        <p className="text-stitch-muted text-sm mt-1">
          Here is your spelling performance summary.
        </p>
      </div>

      {/* Summary Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bento-card p-6 text-center">
          <div className="text-xs font-mono text-stitch-muted uppercase tracking-wider mb-1">Score</div>
          <div className="text-4xl font-extrabold text-indigo-400">
            {correctCount} / {totalCount}
          </div>
        </div>

        <div className="bento-card p-6 text-center">
          <div className="text-xs font-mono text-stitch-muted uppercase tracking-wider mb-1">Accuracy</div>
          <div className={`text-4xl font-extrabold ${accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {accuracy}%
          </div>
        </div>

        <div className="bento-card p-6 text-center">
          <div className="text-xs font-mono text-stitch-muted uppercase tracking-wider mb-1">Incorrect Spellings</div>
          <div className="text-4xl font-extrabold text-rose-400">
            {misspeltResults.length}
          </div>
        </div>
      </div>

      {/* Detailed Word List */}
      <div className="bento-card p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Detailed Word Results</span>
          <span className="text-xs text-stitch-muted font-normal font-mono">
            {misspeltResults.length > 0 ? 'Incorrect words auto-saved to Misspelt Pool' : 'Perfect Score!'}
          </span>
        </h3>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {results.map((r, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                r.isCorrect
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{r.isCorrect ? '✅' : '❌'}</span>
                <div>
                  <div className="font-bold text-base font-mono text-white">
                    {r.expected}
                  </div>
                  {!r.isCorrect && (
                    <div className="text-xs font-mono text-rose-300">
                      You typed: <span className="underline font-bold">{r.typed || '(timed out)'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs font-mono text-neutral-400">
                {r.timeSpent}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {misspeltResults.length > 0 && (
          <button
            type="button"
            onClick={() => startQuiz(misspeltResults.map(r => r.expected))}
            className="py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg transition-all"
          >
            🔄 Retry Missed Words
          </button>
        )}

        {misspeltPool.length > 0 && (
          <button
            type="button"
            onClick={exportSpellingMisspeltPoolTxt}
            className="py-3 px-6 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
          >
            📥 Export Misspelt Pool (.txt)
          </button>
        )}

        <Button onClick={() => setPhase('SETUP')}>
          ✨ New Spelling Quiz
        </Button>
      </div>
    </div>
  );
};
