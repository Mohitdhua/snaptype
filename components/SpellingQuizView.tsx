import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { extractTextFromImage } from '../services/geminiService';
import {
  getSpellingMisspeltPool,
  addWordsToSpellingMisspeltPool,
  exportSpellingMisspeltPoolTxt,
  clearSpellingMisspeltPool
} from '../services/storageService';
import { piperTtsService, PIPER_VOICE_MODELS, TtsEngineMode } from '../services/piperTtsService';
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
  const [speechRate, setSpeechRate] = useState<number>(0.75); // Slower, clearer pronunciation speed
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState(false);

  // Engine Mode & Voices
  const [ttsEngineMode, setTtsEngineMode] = useState<TtsEngineMode>('PIPER_NEURAL');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [selectedPiperVoiceId, setSelectedPiperVoiceId] = useState<string>('piper-lessac-medium');

  // Input / Setup state
  const [inputText, setInputText] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [misspeltPool, setMisspeltPool] = useState<string[]>(() => getSpellingMisspeltPool());

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [results, setResults] = useState<SpellingWordResult[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(7);
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'none' | 'correct' | 'incorrect'>('none');

  // Timers, Audio & Offscreen Input for Mobile Virtual Keyboard
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wordStartTimeRef = useRef<number>(Date.now());
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const typedLettersRef = useRef<string[]>([]);
  const isTransitioningRef = useRef(false);
  const lastProcessedKeyRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  // Load available system voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);

      if (!selectedVoiceURI && (englishVoices.length > 0 || voices.length > 0)) {
        const pool = englishVoices.length > 0 ? englishVoices : voices;
        const preferred = pool.find(v =>
          /google|natural|neural|samantha|premium|enhanced/i.test(v.name)
        ) || pool[0];
        if (preferred) {
          setSelectedVoiceURI(preferred.voiceURI);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoiceURI]);

  // Sync misspelt pool
  const refreshPool = () => {
    setMisspeltPool(getSpellingMisspeltPool());
  };

  // Speech synthesis helper via piperTtsService
  const speakWord = useCallback((wordToSpeak: string) => {
    setIsPronouncing(true);

    piperTtsService.speak(wordToSpeak, {
      engineMode: ttsEngineMode,
      piperVoiceId: selectedPiperVoiceId,
      voiceURI: selectedVoiceURI,
      rate: speechRate,
      pitch: speechPitch,
      onStart: () => {
        setIsPronouncing(true);
      },
      onEnd: () => {
        setIsPronouncing(false);
        wordStartTimeRef.current = Date.now();
      },
      onError: () => {
        setIsPronouncing(false);
        wordStartTimeRef.current = Date.now();
      }
    });
  }, [ttsEngineMode, selectedPiperVoiceId, selectedVoiceURI, speechRate, speechPitch]);

  // Focus mobile input to pop up virtual keyboard
  const focusInput = useCallback(() => {
    if (mobileInputRef.current) {
      mobileInputRef.current.focus();
    } else if (inputContainerRef.current) {
      inputContainerRef.current.focus();
    }
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
    typedLettersRef.current = [];
    setTypedLetters([]);
    isTransitioningRef.current = false;
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
    typedLettersRef.current = [];
    setTypedLetters([]);
    isTransitioningRef.current = false;
    setFeedbackStatus('none');
    setTimeLeft(secondsPerWord);

    // Speak word first
    speakWord(currentWord);

    // Auto focus for mobile soft keyboard & desktop keyboard
    setTimeout(() => {
      focusInput();
    }, 50);
  }, [currentIndex, phase, words, secondsPerWord, speakWord, focusInput]);

  // Countdown timer per word: ONLY runs when NOT pronouncing speech
  useEffect(() => {
    if (phase !== 'PLAYING' || feedbackStatus !== 'none' || isPronouncing) return;

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
  }, [timeLeft, phase, feedbackStatus, isPronouncing]);

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
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);

    const currentWord = words[currentIndex] || '';
    const typedWord = typedLettersRef.current.join('').toLowerCase();
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
  }, [words, currentIndex]);

  // Process key presses
  const processKey = useCallback((key: string) => {
    if (phase !== 'PLAYING' || isTransitioningRef.current || feedbackStatus !== 'none') return;

    const currentWord = words[currentIndex];
    if (!currentWord) return;

    // Deduplicate duplicate keystrokes within 35ms
    const now = Date.now();
    if (key !== 'Backspace' && lastProcessedKeyRef.current.key === key.toLowerCase() && now - lastProcessedKeyRef.current.time < 35) {
      return;
    }
    lastProcessedKeyRef.current = { key: key.toLowerCase(), time: now };

    if (key === 'Backspace') {
      if (typedLettersRef.current.length > 0) {
        typedLettersRef.current = typedLettersRef.current.slice(0, -1);
        setTypedLetters(typedLettersRef.current);
      }
      return;
    }

    // Shortcut to repeat audio
    if (key === ' ' || key === 'Enter') {
      speakWord(currentWord);
      return;
    }

    // Only accept single alphabetic characters
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      if (typedLettersRef.current.length < currentWord.length) {
        const nextLetter = key.toLowerCase();
        const updatedLetters = [...typedLettersRef.current, nextLetter];
        typedLettersRef.current = updatedLetters;
        setTypedLetters(updatedLetters);

        // Auto-advance as soon as final box is typed!
        if (updatedLetters.length === currentWord.length) {
          isTransitioningRef.current = true;
          if (timerRef.current) clearTimeout(timerRef.current);
          const typedWord = updatedLetters.join('').toLowerCase();
          const isCorrect = typedWord === currentWord.toLowerCase();
          setFeedbackStatus(isCorrect ? 'correct' : 'incorrect');

          const timeSpent = Math.round((Date.now() - wordStartTimeRef.current) / 1000);
          setResults(rPrev => [
            ...rPrev,
            {
              expected: currentWord,
              typed: typedWord,
              isCorrect,
              timeSpent
            }
          ]);

          setTimeout(() => {
            setCurrentIndex(cPrev => cPrev + 1);
          }, 350);
        }
      }
    }
  }, [phase, feedbackStatus, words, currentIndex, speakWord]);

  // Global window keyboard listener for desktop (zero bubbling, zero duplication)
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const onWindowKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target !== mobileInputRef.current) return;
      if (e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Backspace' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        processKey(e.key);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setPhase('SETUP');
        return;
      }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        processKey(e.key);
        return;
      }
    };

    window.addEventListener('keydown', onWindowKeyDown);
    return () => window.removeEventListener('keydown', onWindowKeyDown);
  }, [phase, processKey]);

  // Mobile virtual keyboard input change handler
  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    e.target.value = '';
    if (!val) return;
    const lastChar = val.slice(-1);
    if (/[a-zA-Z]/.test(lastChar)) {
      processKey(lastChar);
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#131924] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
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
                {/* Engine Mode Selection */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-300 mb-2">
                    Speech Engine Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTtsEngineMode('PIPER_NEURAL')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        ttsEngineMode === 'PIPER_NEURAL'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span>🤖</span> PiperTTS Neural
                      </div>
                      <div className="text-[10px] font-normal text-neutral-400">
                        High Clarity Offline Neural Voice
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTtsEngineMode('NATIVE_WEB_SPEECH')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        ttsEngineMode === 'NATIVE_WEB_SPEECH'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span>🌐</span> Native Web Speech
                      </div>
                      <div className="text-[10px] font-normal text-neutral-400">
                        System Browser Speech API
                      </div>
                    </button>
                  </div>
                </div>

                {/* Per Word Timer Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-neutral-300">
                      Time limit per word (starts after audio)
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

                {/* PiperTTS Neural Model Selection */}
                {ttsEngineMode === 'PIPER_NEURAL' && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">
                      PiperTTS Voice Model
                    </label>
                    <select
                      value={selectedPiperVoiceId}
                      onChange={e => setSelectedPiperVoiceId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PIPER_VOICE_MODELS.map(pv => (
                        <option key={pv.id} value={pv.id}>
                          {pv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Speech Speed / Rate Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-neutral-300">
                      Speech Speed (Pronunciation Rate)
                    </label>
                    <span className="text-indigo-400 font-mono font-bold text-base">
                      {speechRate.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    value={speechRate}
                    onChange={e => setSpeechRate(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                    <span>0.50x (Very Slow)</span>
                    <span>1.00x (Normal)</span>
                  </div>
                </div>

                {/* Speech Pitch Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-neutral-300">
                      Voice Pitch
                    </label>
                    <span className="text-indigo-400 font-mono font-bold text-base">
                      {speechPitch.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={1.2}
                    step={0.1}
                    value={speechPitch}
                    onChange={e => setSpeechPitch(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                    <span>0.8 (Lower Tone)</span>
                    <span>1.2 (Higher Tone)</span>
                  </div>
                </div>

                {/* Voice Accent Selector for Native Speech */}
                {ttsEngineMode === 'NATIVE_WEB_SPEECH' && availableVoices.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-neutral-300 mb-2">
                      System Accent / Voice
                    </label>
                    <select
                      value={selectedVoiceURI}
                      onChange={e => setSelectedVoiceURI(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableVoices
                        .sort((a, b) => {
                          const aIsIndian = a.lang.includes('en-IN') || /india|veena|rishi|neerja/i.test(a.name);
                          const bIsIndian = b.lang.includes('en-IN') || /india|veena|rishi|neerja/i.test(b.name);
                          if (aIsIndian && !bIsIndian) return -1;
                          if (!aIsIndian && bIsIndian) return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map(v => {
                          const isIndian = v.lang.includes('en-IN') || /india|veena|rishi|neerja/i.test(v.name);
                          return (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {isIndian ? '🇮🇳 ' : ''}{v.name} ({v.lang})
                            </option>
                          );
                        })}
                    </select>
                  </div>
                )}

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
        onClick={focusInput}
        className="w-full max-w-3xl mx-auto p-2 md:p-6 flex flex-col items-center focus:outline-none select-none animate-fade-in relative"
      >
        {/* Offscreen / Hidden Input for Mobile Soft Keyboard Focus */}
        <input
          ref={mobileInputRef}
          type="text"
          value=""
          onChange={handleMobileInputChange}
          onBlur={() => {
            if (phase === 'PLAYING') {
              mobileInputRef.current?.focus();
            }
          }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className="opacity-0 absolute top-0 left-0 w-full h-12 pointer-events-auto cursor-pointer focus:outline-none"
          aria-label="Tap to open virtual keyboard"
        />

        {/* Top Progress Bar & Timer */}
        <div className="w-full flex items-center justify-between mb-3 z-10 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Word {currentIndex + 1} / {words.length}
            </span>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {isPronouncing ? '🗣️ Speaking...' : `⏱️ ${timeLeft}s`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setPhase('SETUP')}
            className="text-xs font-semibold text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 bg-white/5"
          >
            Exit Quiz
          </button>
        </div>

        {/* Progress Timer Line */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4 z-10">
          <div
            className={`h-full transition-[width] duration-300 ease-out ${
              timeLeft <= 2 ? 'bg-rose-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${(timeLeft / secondsPerWord) * 100}%` }}
          />
        </div>

        {/* PROMINENT TOP LETTER BOXES (Always visible above soft keyboard) */}
        <div
          onClick={focusInput}
          className="flex flex-col items-center justify-center w-full mb-4 z-10 cursor-pointer"
        >
          <div className={`flex flex-wrap items-center justify-center gap-1.5 md:gap-3 p-3 rounded-2xl transition-colors duration-150 ${
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
                  className={`w-10 h-12 md:w-16 md:h-20 rounded-xl border-2 flex items-center justify-center text-xl md:text-3xl font-black font-mono uppercase transition-colors duration-75 ${
                    letter
                      ? 'border-indigo-500/80 bg-indigo-950/40 text-white'
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
        </div>

        {/* Compact Audio Speaker & Replay Controls */}
        <div className="bento-card w-full p-4 md:p-6 text-center flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                speakWord(currentWord);
                focusInput();
              }}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition-all cursor-pointer border border-indigo-400/30"
              title="Click or press Space/Enter to replay audio"
            >
              🔊
            </button>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Replay Audio</div>
              <div className="text-[10px] text-stitch-muted font-mono">
                Engine: {ttsEngineMode === 'PIPER_NEURAL' ? 'PiperTTS Neural' : 'Native Web Speech'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-neutral-400">
              {isPronouncing ? 'Listening...' : 'Type letters now!'}
            </div>
          </div>
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
