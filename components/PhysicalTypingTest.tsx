import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { TestResults, TimeLimit } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';

interface PhysicalTypingTestProps {
  ocrText: string;
  imageSrc: string | null;
  referenceText?: string | null;
  timeLimit: TimeLimit;
  isSSC?: boolean;
  onComplete: (results: TestResults) => void;
  onRestart: () => void;
}

export const PhysicalTypingTest: React.FC<PhysicalTypingTestProps> = ({ ocrText, imageSrc, referenceText = null, timeLimit, isSSC = false, onComplete, onRestart }) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showReference, setShowReference] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef(input);
  const startTimeRef = useRef(startTime);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);
  const mouseMoveRafRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);
  const totalKeystrokesRef = useRef(0);
  const backspaceCountRef = useRef(0);

  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => {
    hasCompletedRef.current = false;
    totalKeystrokesRef.current = 0;
    backspaceCountRef.current = 0;
  }, [ocrText, timeLimit, isSSC]);

  const finishTest = useCallback((finalTime?: number) => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      const currentInput = inputRef.current;
      const currentStartTime = startTimeRef.current;

      const endTime = finalTime || (currentStartTime ? (Date.now() - currentStartTime) / 1000 : 0);
      const effectiveTime = Math.max(0.001, endTime);
      const minutes = effectiveTime / 60;

      const cleanInput = currentInput.trim().replace(/\s+/g, ' ');
      const cleanTargetFull = ocrText.trim().replace(/\s+/g, ' ');

      const normalizedCharCount = cleanInput.length;
      const compareLen = normalizedCharCount;
      
      if (compareLen === 0) {
          onComplete({
              netWpm: 0, rawWpm: 0, accuracy: 0, timeElapsed: effectiveTime,
              totalChars: 0, correctChars: 0, incorrectChars: 0,
              hardKeys: {}, missedWords: {}, history: [],
              originalText: '', typedText: currentInput,
              isSSC: isSSC ? true : undefined,
              sscMarks: isSSC ? 0 : undefined
          });
          return;
      }

      const comparisonTarget = cleanTargetFull.slice(0, compareLen);
      const distance = levenshteinDistance(cleanInput, comparisonTarget);
      const errors = distance;
      const correctChars = Math.max(0, cleanInput.length - errors);
      
      // Calculate Missed Words and Truncate Original Text
      const missedWordsCount: Record<string, number> = {};
      const targetWords = cleanTargetFull.split(/\s+/);
      const inputWords = cleanInput.split(/\s+/);
      
      let inputIdx = 0;
      let lastProcessedTargetIndex = 0;

      for (let i = 0; i < targetWords.length; i++) {
          // Stop if we run out of user input (Cleaner stats for partial tests)
          if (inputIdx >= inputWords.length) {
              break;
          }

          lastProcessedTargetIndex = i;
          const targetWord = targetWords[i];
          
          // Look ahead window of 3 to tolerate skipped words
          let found = false;
          for (let j = 0; j < 3; j++) { 
              if (inputIdx + j < inputWords.length) {
                  if (inputWords[inputIdx + j] === targetWord) {
                      inputIdx += j + 1; // Advance past this word
                      found = true;
                      break;
                  }
              }
          }
          
          if (!found) {
              // Assume word was skipped or substituted
              // Increment missed count
              missedWordsCount[targetWord] = (missedWordsCount[targetWord] || 0) + 1;
              // Advance input index to simulate substitution (one-for-one error)
              // This prevents staying stuck on one input word
              if (inputIdx < inputWords.length) {
                  inputIdx++;
              }
          }
      }

      // Truncate original text to match where the user stopped
      // This ensures the Diff View is clean and doesn't show the untyped rest of the document
      let charLimit = 0;
      let wordCount = 0;
      const targetLimit = lastProcessedTargetIndex + 1;
      
      // Find the character index in raw ocrText corresponding to the last processed word
      // to preserve newlines/formatting in the result
      const matches = ocrText.matchAll(/(\S+)/g);
      for (const match of matches) {
          wordCount++;
          if (wordCount >= targetLimit) {
             charLimit = (match.index || 0) + match[0].length;
             // If user typed MORE than target, we might just show full text
             break;
          }
      }
      // If we processed everything, or input > target, use full length
      if (charLimit === 0 || wordCount < targetLimit) charLimit = ocrText.length;

      const truncatedOriginalRaw = ocrText.slice(0, charLimit);

      let rawWpm = Math.round((normalizedCharCount / 5) / minutes);
      let netWpm = Math.max(0, Math.round(((normalizedCharCount - errors) / 5) / minutes));
      const accuracy = Math.max(0, Math.round((correctChars / cleanInput.length) * 100));
      
      const totalKeystrokes = Math.max(cleanInput.length, totalKeystrokesRef.current);
      const totalRawErrors = errors + backspaceCountRef.current;
      const realAccuracy = totalKeystrokes > 0
        ? Math.max(0, Math.min(100, Math.round(((totalKeystrokes - totalRawErrors) / totalKeystrokes) * 100)))
        : accuracy;
      
      let sscMarks: number | undefined;

      if (isSSC) {
          const tentativeSpeed = (normalizedCharCount / 5) / minutes;
          rawWpm = Math.round(tentativeSpeed);
          netWpm = Math.max(0, Math.round(tentativeSpeed - errors));

          let marks = 0;
          if (netWpm >= 30) marks = 10;
          if (netWpm >= 31) marks = 12;
          if (netWpm >= 36) marks = 15;
          if (netWpm >= 41) marks = 18;
          if (netWpm >= 46) marks = 21;
          if (netWpm > 50) marks = 25;
          sscMarks = marks;
      }

      const results: TestResults = {
          netWpm, rawWpm, accuracy,
          realAccuracy,
          totalKeystrokes,
          totalRawErrors,
          backspaceCount: backspaceCountRef.current,
          correctedErrors: backspaceCountRef.current,
          timeElapsed: effectiveTime,
          totalChars: normalizedCharCount, correctChars, incorrectChars: errors,
          hardKeys: {}, 
          missedWords: missedWordsCount, 
          history: [],
          originalText: truncatedOriginalRaw,
          typedText: currentInput,
          isSSC: isSSC ? true : undefined,
          sscMarks
      };

      onComplete(results);
  }, [ocrText, onComplete, isSSC]);

  const finishTestRef = useRef(finishTest);
  useEffect(() => { finishTestRef.current = finishTest; }, [finishTest]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1000;
        setElapsed(diff);
        if (timeLimit > 0 && diff >= timeLimit) {
            clearInterval(interval);
            finishTestRef.current(diff);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [startTime, timeLimit]);

  useEffect(() => {
      textareaRef.current?.focus();
      return () => {
          if (scrollRafRef.current !== null) {
              cancelAnimationFrame(scrollRafRef.current);
          }
          if (mouseMoveRafRef.current !== null) {
              cancelAnimationFrame(mouseMoveRafRef.current);
          }
      };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (hasCompletedRef.current) return;
    const prevInput = input;
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());

    if (val.length > prevInput.length) {
      totalKeystrokesRef.current += (val.length - prevInput.length);
    } else if (val.length < prevInput.length) {
      backspaceCountRef.current += (prevInput.length - val.length);
    }

    setInput(val);

    if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
        if (textareaRef.current && mirrorRef.current) {
            const textarea = textareaRef.current;
            const mirror = mirrorRef.current;
            mirror.style.width = `${textarea.clientWidth}px`;
            const selectionEnd = e.target.selectionEnd;
            const textToCursor = val.substring(0, selectionEnd);
            mirror.textContent = textToCursor.endsWith('\n') ? textToCursor + '\u200b' : textToCursor;
            const targetScroll = mirror.scrollHeight - (textarea.clientHeight / 2);
            textarea.scrollTop = targetScroll;
        }
        scrollRafRef.current = null;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!imageContainerRef.current || zoomLevel <= 1.01) return;
      if (mouseMoveRafRef.current !== null) return;

      const { clientX, clientY } = e;
      mouseMoveRafRef.current = requestAnimationFrame(() => {
          if (!imageContainerRef.current) {
              mouseMoveRafRef.current = null;
              return;
          }
          const rect = imageContainerRef.current.getBoundingClientRect();
          const x = ((clientX - rect.left) / rect.width) * 100;
          const y = ((clientY - rect.top) / rect.height) * 100;
          setMousePos({ x, y });
          mouseMoveRafRef.current = null;
      });
  };

  const formatTime = (secs: number) => {
      if (timeLimit > 0) {
          const remaining = Math.max(0, timeLimit - secs);
          const m = Math.floor(remaining / 60);
          const s = Math.floor(remaining % 60);
          return `${m}:${s.toString().padStart(2, '0')}`;
      } else {
          const m = Math.floor(secs / 60);
          const s = Math.floor(secs % 60);
          return `${m}:${s.toString().padStart(2, '0')}`;
      }
  };

  const hasReference = Boolean(imageSrc || referenceText);
  const referenceLabel = imageSrc ? 'Document Image' : 'Reference Text';
  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const currentPaceWpm = elapsed > 2 ? Math.round((input.length / 5) / (elapsed / 60)) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-5 h-[82vh] animate-fade-in">
      {/* Left Side: Document Reference Workstation */}
      {hasReference && showReference && (
        <div className="md:w-1/2 h-72 md:h-full transition-all duration-300 flex flex-col bento-card bg-neutral-950/70 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl z-20">
          <div className="p-3.5 bg-black/40 flex justify-between items-center backdrop-blur-md border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                {referenceLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {showReference && imageSrc && (
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setZoomLevel(1)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-medium transition-colors ${
                      zoomLevel === 1 ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setZoomLevel(1.5)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-medium transition-colors ${
                      zoomLevel === 1.5 ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    1.5x
                  </button>
                  <button
                    onClick={() => setZoomLevel(2.5)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-medium transition-colors ${
                      zoomLevel === 2.5 ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    2.5x
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowReference(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                aria-label={`Collapse ${referenceLabel}`}
                title={`Collapse ${referenceLabel}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {showReference && imageSrc && (
            <div
              ref={imageContainerRef}
              className="flex-1 overflow-hidden relative cursor-crosshair bg-neutral-900/30 select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                if (mouseMoveRafRef.current !== null) {
                  cancelAnimationFrame(mouseMoveRafRef.current);
                  mouseMoveRafRef.current = null;
                }
              }}
              onMouseEnter={() => setZoomLevel(prev => Math.max(prev, 1.01))}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                  src={imageSrc}
                  alt="Reference Document"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-100 ease-out border border-white/5"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                  }}
                />
              </div>
            </div>
          )}

          {showReference && !imageSrc && referenceText && (
            <div className="flex-1 overflow-auto p-6 bg-neutral-950/40 scrollbar-thin scrollbar-thumb-slate-600">
              <pre className="whitespace-pre-wrap break-words text-sm md:text-base font-mono text-neutral-300 leading-relaxed font-normal selection:bg-indigo-500/30">
                {referenceText}
              </pre>
            </div>
          )}
        </div>
      )}

      {hasReference && !showReference && (
        <button
          type="button"
          onClick={() => setShowReference(true)}
          className="shrink-0 self-start mt-1 bento-card bg-neutral-950/80 border border-white/10 text-neutral-300 hover:text-white hover:border-indigo-500/50 rounded-2xl px-4 py-2.5 shadow-xl transition-all flex items-center gap-2"
          title={`Expand ${referenceLabel}`}
        >
          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">Show Reference</span>
        </button>
      )}

      {/* Right Side: Typing Workspace */}
      <div className="flex-1 flex flex-col h-full gap-4 min-w-0">
        {/* Workspace Header HUD */}
        <div className="bento-card bg-neutral-950/80 backdrop-blur-xl border border-white/10 p-3.5 md:p-4 rounded-2xl flex flex-wrap justify-between items-center shadow-2xl gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">
                  {isSSC ? 'SSC Exam Mode' : 'Physical / Paper Mode'}
                </span>
                {isSSC && (
                  <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    OFFICIAL
                  </span>
                )}
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-3 mt-0.5 font-mono">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} chars</span>
                {currentPaceWpm > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-400 font-bold">~{currentPaceWpm} WPM</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                {timeLimit > 0 ? 'Remaining' : 'Elapsed'}
              </div>
              <div className={`text-2xl font-black leading-none mt-0.5 ${
                timeLimit > 0 && (timeLimit - elapsed) < 10 ? 'text-rose-500 animate-pulse' : 'text-neutral-100'
              }`}>
                {formatTime(elapsed)}
              </div>
            </div>
          </div>
        </div>

        {/* Input Textarea Area */}
        <div className="relative flex-1 w-full min-h-0 bento-card bg-neutral-950/60 backdrop-blur-2xl rounded-3xl border border-white/10 hover:border-white/15 focus-within:border-indigo-500/40 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            className="w-full h-full bg-transparent p-6 md:p-8 text-lg md:text-xl font-mono text-neutral-100 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed transition-all caret-indigo-400 selection:bg-indigo-500/30 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600"
            placeholder="Start typing what you see on the document..."
            spellCheck={false}
          />
          
          {/* Mirror Div for Scroll Calculation */}
          <div 
            ref={mirrorRef}
            className="absolute top-0 left-0 -z-50 invisible p-6 md:p-8 text-lg md:text-xl font-mono leading-relaxed border border-transparent whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Action Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => finishTest()}
            className="flex-1 py-3 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2"
          >
            <span>Finish & Analyze Test</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-normal bg-black/10 px-1.5 py-0.5 rounded text-neutral-700">
              Ctrl+↵
            </kbd>
          </button>
          <button
            onClick={onRestart}
            className="py-3 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <span>Cancel</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-normal bg-white/10 px-1.5 py-0.5 rounded text-neutral-400">
              Esc
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
};
