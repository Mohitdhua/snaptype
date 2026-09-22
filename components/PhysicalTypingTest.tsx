import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { TestResults, TimeLimit } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';
import { TYPING_FONTS, TypingFont, AUTOPAUSE_ENABLED_KEY, AUTOPAUSE_DELAY_KEY, PauseReason } from './TypingTest';

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
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>(null);
  const [autoPauseEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTOPAUSE_ENABLED_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [autoPauseDelay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(AUTOPAUSE_DELAY_KEY);
      const parsed = saved ? parseInt(saved, 10) : 5;
      return [3, 5, 10].includes(parsed) ? parsed : 5;
    } catch {
      return 5;
    }
  });

  const accumulatedTimeMsRef = useRef<number>(0);
  const activeSegmentStartTimeRef = useRef<number | null>(null);
  const autoPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef<boolean>(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const [typingFont] = useState<TypingFont>(() => {
    try {
      const saved = localStorage.getItem('snaptype_typing_font_v1');
      if (saved && TYPING_FONTS.some(f => f.id === saved)) {
        return saved as TypingFont;
      }
    } catch {}
    return 'inter';
  });
  const activeFontClass = TYPING_FONTS.find(f => f.id === typingFont)?.className || 'font-sans-clean';

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
    accumulatedTimeMsRef.current = 0;
    activeSegmentStartTimeRef.current = null;
    setIsPaused(false);
    setPauseReason(null);
    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }
  }, [ocrText, timeLimit, isSSC]);

  const getPreciseElapsedSecs = useCallback((): number => {
    let totalMs = accumulatedTimeMsRef.current;
    if (activeSegmentStartTimeRef.current !== null && !isPausedRef.current) {
      totalMs += (Date.now() - activeSegmentStartTimeRef.current);
    }
    return totalMs / 1000;
  }, []);

  const pauseTest = useCallback((reason: PauseReason = 'manual') => {
    if (hasCompletedRef.current || !startTimeRef.current || isPausedRef.current) return;
    if (activeSegmentStartTimeRef.current !== null) {
      accumulatedTimeMsRef.current += (Date.now() - activeSegmentStartTimeRef.current);
      activeSegmentStartTimeRef.current = null;
    }
    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }
    isPausedRef.current = true;
    setIsPaused(true);
    setPauseReason(reason);
  }, []);

  const resumeTest = useCallback(() => {
    if (hasCompletedRef.current || !isPausedRef.current) return;
    activeSegmentStartTimeRef.current = Date.now();
    isPausedRef.current = false;
    setIsPaused(false);
    setPauseReason(null);
    textareaRef.current?.focus();
  }, []);

  const resetAutoPauseTimer = useCallback(() => {
    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }
    if (!autoPauseEnabled || !startTimeRef.current || isPausedRef.current || hasCompletedRef.current) {
      return;
    }
    autoPauseTimeoutRef.current = setTimeout(() => {
      if (!isPausedRef.current && !hasCompletedRef.current) {
        pauseTest('auto_idle');
      }
    }, autoPauseDelay * 1000);
  }, [autoPauseEnabled, autoPauseDelay, pauseTest]);

  // Window / Tab blur and visibility change handlers
  useEffect(() => {
    const handleBlur = () => {
      if (autoPauseEnabled && startTimeRef.current && !isPausedRef.current && !hasCompletedRef.current) {
        pauseTest('auto_blur');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && autoPauseEnabled && startTimeRef.current && !isPausedRef.current && !hasCompletedRef.current) {
        pauseTest('auto_blur');
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (autoPauseTimeoutRef.current) {
        clearTimeout(autoPauseTimeoutRef.current);
      }
    };
  }, [autoPauseEnabled, pauseTest]);

  // Global session shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isPausedRef.current) {
        if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          resumeTest();
          return;
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          onRestart();
          return;
        }
        if (event.key.length === 1 || event.key === 'Backspace') {
          resumeTest();
          return;
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        if (startTimeRef.current && !hasCompletedRef.current) {
          pauseTest('manual');
        } else {
          onRestart();
        }
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onRestart, resumeTest, pauseTest]);

  const finishTest = useCallback((finalTime?: number) => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      if (autoPauseTimeoutRef.current) {
        clearTimeout(autoPauseTimeoutRef.current);
        autoPauseTimeoutRef.current = null;
      }
      if (activeSegmentStartTimeRef.current !== null) {
        accumulatedTimeMsRef.current += (Date.now() - activeSegmentStartTimeRef.current);
        activeSegmentStartTimeRef.current = null;
      }
      const currentInput = inputRef.current;

      const endTime = finalTime !== undefined ? finalTime : getPreciseElapsedSecs();
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
    if (startTime && !isPaused) {
      interval = setInterval(() => {
        if (hasCompletedRef.current) return;
        const currentElapsed = getPreciseElapsedSecs();
        setElapsed(currentElapsed);
        if (timeLimit > 0 && currentElapsed >= timeLimit) {
            clearInterval(interval);
            finishTestRef.current(currentElapsed);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [startTime, isPaused, timeLimit, getPreciseElapsedSecs]);

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
    if (isPausedRef.current) {
      resumeTest();
    }
    if (!startTime) {
      const now = Date.now();
      setStartTime(now);
      accumulatedTimeMsRef.current = 0;
      activeSegmentStartTimeRef.current = now;
    }
    resetAutoPauseTimer();

    if (val.length > prevInput.length) {
      totalKeystrokesRef.current += (val.length - prevInput.length);
    } else if (val.length < prevInput.length) {
      backspaceCountRef.current += (prevInput.length - val.length);
    }

    setInput(val);
    resetAutoPauseTimer();

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
            {startTime && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPaused) resumeTest();
                  else pauseTest('manual');
                }}
                className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPaused
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                    : 'text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
                title={isPaused ? 'Resume Test (Esc or Space)' : 'Pause Test (Esc)'}
              >
                <span>{isPaused ? '▶' : '⏸'}</span>
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}

            <div className="text-right font-mono">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold flex items-center justify-end gap-1.5">
                <span>{timeLimit > 0 ? 'Remaining' : 'Elapsed'}</span>
                {isPaused && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase animate-pulse">
                    Paused
                  </span>
                )}
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
          {/* Pause Overlay (Displays when isPaused is true) */}
          {isPaused && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 md:p-8 bg-neutral-950/85 backdrop-blur-xl border border-amber-500/30 rounded-3xl pause-overlay text-neutral-100 animate-fade-in select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pause Icon & Title */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center text-2xl shadow-[0_0_25px_rgba(245,158,11,0.25)] mb-3 animate-pulse">
                  ⏸️
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    {pauseReason === 'auto_idle'
                      ? 'Auto-Paused (Inactivity)'
                      : pauseReason === 'auto_blur'
                      ? 'Auto-Paused (Tab Switched)'
                      : 'Session Paused'}
                  </h3>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Frozen
                  </span>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-md">
                  {pauseReason === 'auto_idle'
                    ? `Detected ${autoPauseDelay} seconds of inactivity. Timer is paused.`
                    : pauseReason === 'auto_blur'
                    ? 'Window or tab lost focus. Your typing test is paused.'
                    : 'Timer and speed metrics are frozen. Resume when you are ready.'}
                </p>
              </div>

              {/* Snapshot Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mb-6">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Speed</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono mt-0.5">{currentPaceWpm}</span>
                  <span className="text-[10px] text-neutral-500">Pace WPM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Words</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{wordCount}</span>
                  <span className="text-[10px] text-neutral-500">Total Words</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
                    {timeLimit > 0 ? 'Remaining' : 'Elapsed'}
                  </span>
                  <span className="text-2xl font-black text-neutral-200 font-mono mt-0.5">{formatTime(elapsed)}</span>
                  <span className="text-[10px] text-neutral-500">Timer</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Chars</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono mt-0.5">{charCount}</span>
                  <span className="text-[10px] text-neutral-500">Key Strokes</span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                <button
                  onClick={(e) => { e.stopPropagation(); resumeTest(); }}
                  className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>▶ Resume Typing</span>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white font-normal">
                    Esc / Space
                  </kbd>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRestart(); }}
                  className="py-3 px-5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Cancel / Restart (Tab)"
                >
                  <span>↺ Cancel</span>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 font-normal">
                    Tab
                  </kbd>
                </button>
                {charCount >= 20 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); finishTest(); }}
                    className="py-3 px-4 rounded-2xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/8 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Finish and calculate results now"
                  >
                    <span>Finish Now</span>
                  </button>
                )}
              </div>

              {/* Quick Resume Helper Footnote */}
              <div className="mt-4 text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tip: Simply start typing to immediately resume</span>
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            className={`w-full h-full bg-transparent p-6 md:p-8 text-lg md:text-xl ${activeFontClass} text-neutral-100 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed transition-all caret-indigo-400 selection:bg-indigo-500/30 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600`}
            placeholder="Start typing what you see on the document..."
            spellCheck={false}
          />
          
          {/* Mirror Div for Scroll Calculation */}
          <div 
            ref={mirrorRef}
            className={`absolute top-0 left-0 -z-50 invisible p-6 md:p-8 text-lg md:text-xl ${activeFontClass} leading-relaxed border border-transparent whitespace-pre-wrap break-words overflow-hidden pointer-events-none`}
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
