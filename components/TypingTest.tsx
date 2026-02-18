
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { TestResults, TimeLimit } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';
import { VirtualKeyboard } from './VirtualKeyboard';
import { playSound } from '../services/soundService';

const TYPING_TEXT_SCALE_KEY = 'snaptype_typing_text_scale_v1';

interface TypingTestProps {
  text: string;
  timeLimit: TimeLimit;
  onComplete: (results: TestResults) => void;
  onRestart: () => void;
  isSSC?: boolean;
}

// Memoized char item
const CharItem = React.memo(({ char, status, index }: { char: string, status: 'pending' | 'correct' | 'incorrect', index: number }) => {
    let className = "relative font-mono transition-colors duration-75 inline-block ";
    
    if (status === 'pending') className += "text-slate-500";
    else if (status === 'correct') className += "text-emerald-400";
    else if (status === 'incorrect') className += "text-rose-500 bg-rose-500/20 rounded";

    return (
        <span id={`char-${index}`} className={className}>
            {char === '\n' ? '↵' : char}
            {char === '\n' && <br/>}
        </span>
    );
}, (prev, next) => {
    return prev.status === next.status && prev.char === next.char;
});

export const TypingTest: React.FC<TypingTestProps> = ({ text, timeLimit, onComplete, onRestart, isSSC = false }) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currIndex, setCurrIndex] = useState(0);
  const [hardKeys, setHardKeys] = useState<Record<string, number>>({});
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0, width: 12 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [textScale, setTextScale] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(TYPING_TEXT_SCALE_KEY);
      const parsed = raw ? Number(raw) : 30;
      if (Number.isNaN(parsed)) return 30;
      return Math.min(46, Math.max(20, parsed));
    } catch {
      return 30;
    }
  });
  
  // History tracking
  const historyRef = useRef<{ time: number; wpm: number; raw: number; accuracy: number }[]>([]);
  
  // Tick state to force re-renders for timer
  const [, setTick] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(TYPING_TEXT_SCALE_KEY, String(textScale));
  }, [textScale]);

  // Memoize target text handling
  const targetText = useMemo(() => text.replace(/\r\n/g, "\n"), [text]);
  const chars = useMemo(() => targetText.split(''), [targetText]);

  // Next expected character for Virtual Keyboard
  const nextChar = useMemo(() => {
      if (currIndex >= targetText.length) return '';
      return targetText[currIndex];
  }, [currIndex, targetText]);

  // Stats calculation
  const calculateStats = useCallback((): TestResults => {
    const timeNow = Date.now();
    const start = startTime || timeNow;
    
    let timeElapsedSecs = (timeNow - start) / 1000;
    if (timeLimit > 0 && timeElapsedSecs > timeLimit) {
        timeElapsedSecs = timeLimit;
    }

    const timeElapsedMins = timeElapsedSecs / 60;
    const effectiveMins = timeElapsedMins < 0.001 ? 0.001 : timeElapsedMins;
    
    // Use Levenshtein distance for smarter error detection (handles desync/skipped chars)
    const expectedSlice = targetText.slice(0, input.length);
    const errors = levenshteinDistance(input, expectedSlice);
    
    const correctChars = Math.max(0, input.length - errors);
    const missedWordsCount: Record<string, number> = {};

    let netWpm = 0;
    let rawWpm = 0;

    if (isSSC) {
        // SSC Calculation: 
        // 1. Words = Total Strokes / 5
        // 2. Tentative Speed = Words / Time
        // 3. Actual Speed = Tentative Speed - Errors
        const totalStrokes = input.length;
        const sscWords = totalStrokes / 5;
        const tentativeSpeed = sscWords / effectiveMins;
        
        rawWpm = Math.round(tentativeSpeed);
        // Net WPM subtracts 1 WPM for every single mistake
        netWpm = Math.max(0, Math.round(tentativeSpeed - errors));
    } else {
        // Standard Calculation
        // Net WPM = (Chars - Errors) / 5 / Mins
        rawWpm = Math.round((input.length / 5) / effectiveMins);
        netWpm = Math.max(0, Math.round(((input.length - errors) / 5) / effectiveMins));
    }

    const accuracy = input.length > 0 
        ? Math.max(0, Math.round(((input.length - errors) / input.length) * 100)) 
        : 100;

    return {
      netWpm,
      rawWpm,
      accuracy,
      timeElapsed: timeElapsedSecs,
      totalChars: input.length,
      correctChars,
      incorrectChars: errors,
      hardKeys,
      missedWords: missedWordsCount,
      history: historyRef.current,
      originalText: targetText,
      typedText: input,
      isSSC: isSSC
    };
  }, [input, startTime, targetText, timeLimit, hardKeys, isSSC]);

  const finishTest = useCallback(() => {
     const partialStats = calculateStats();
     
     // Full missed words calculation
     const missedWordsCount: Record<string, number> = {};
     const wordsIterator = targetText.matchAll(/(\S+)/g);
     for (const match of wordsIterator) {
        const word = match[0];
        const start = match.index!;
        const end = start + word.length;
        if (input.length >= end) {
             const userSlice = input.slice(start, end);
             if (userSlice !== word) {
                 missedWordsCount[word] = (missedWordsCount[word] || 0) + 1;
             }
        }
    }
    
    // Calculate SSC Marks if applicable
    let sscMarks = 0;
    if (isSSC) {
        const speed = partialStats.netWpm;
        if (speed >= 30) sscMarks = 10;
        if (speed >= 31) sscMarks = 12;
        if (speed >= 36) sscMarks = 15;
        if (speed >= 41) sscMarks = 18;
        if (speed >= 46) sscMarks = 21;
        if (speed > 50) sscMarks = 25;
    }

    onComplete({ ...partialStats, missedWords: missedWordsCount, sscMarks: isSSC ? sscMarks : undefined });
  }, [calculateStats, input, targetText, onComplete, isSSC]);

  // Ref to hold the latest version of finishTest
  const finishTestRef = useRef(finishTest);
  useEffect(() => {
    finishTestRef.current = finishTest;
  }, [finishTest]);

  // Real-time update loop (Timer & History)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (startTime) {
      interval = setInterval(() => {
        setTick(t => t + 1);
        
        const stats = calculateStats();
        // Record history every second (approx)
        const historyItem = {
            time: Math.floor(stats.timeElapsed),
            wpm: stats.netWpm,
            raw: stats.rawWpm,
            accuracy: stats.accuracy
        };
        
        // Avoid duplicate time entries
        const lastEntry = historyRef.current[historyRef.current.length - 1];
        if (!lastEntry || lastEntry.time !== historyItem.time) {
            historyRef.current.push(historyItem);
        }

        if (timeLimit > 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= timeLimit) {
            clearInterval(interval);
            if (finishTestRef.current) {
                finishTestRef.current();
            }
          }
        }
      }, 1000); 
    }
    return () => clearInterval(interval);
  }, [startTime, timeLimit, calculateStats]);

  // Check for text completion
  useEffect(() => {
    if (timeLimit === 0 && input.length === targetText.length && input.length > 0) {
       finishTest();
    }
  }, [input, targetText, timeLimit, finishTest]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Session shortcuts: Esc to restart, Ctrl/Cmd+Enter to submit
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onRestart();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && startTime) {
        event.preventDefault();
        finishTestRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onRestart, startTime]);

  // Keep caret aligned to the active character baseline and scroll only when needed.
  useEffect(() => {
      const rafId = requestAnimationFrame(() => {
          const container = containerRef.current;
          if (!container || chars.length === 0) return;

          const charIndexToMeasure = Math.min(currIndex, chars.length - 1);
          const cursorEl = document.getElementById(`char-${charIndexToMeasure}`);
          if (!cursorEl) return;

          const containerRect = container.getBoundingClientRect();
          const cursorRect = cursorEl.getBoundingClientRect();

          const topMargin = 40;
          const bottomMargin = 56;
          const cursorTopInView = cursorRect.top - containerRect.top;
          const cursorBottomInView = cursorRect.bottom - containerRect.top;

          if (cursorBottomInView > container.clientHeight - bottomMargin) {
            container.scrollTop += cursorBottomInView - (container.clientHeight - bottomMargin);
          } else if (cursorTopInView < topMargin) {
            container.scrollTop -= topMargin - cursorTopInView;
          }

          let newLeft = cursorRect.left - containerRect.left + container.scrollLeft;
          let newWidth = Math.max(8, Math.min(28, cursorRect.width));
          if (currIndex >= chars.length) {
            newLeft += cursorRect.width;
            newWidth = Math.max(8, Math.min(20, cursorRect.width * 0.65));
          }

          const underlineTop = cursorRect.bottom - containerRect.top + container.scrollTop - 4;
          setCaretPos({ top: underlineTop, left: newLeft, width: newWidth });
      });
      return () => cancelAnimationFrame(rafId);
  }, [currIndex, chars.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, targetText.length);
    if (!startTime) setStartTime(Date.now());

    // Sound and Logic for new keystroke
    if (val.length === input.length + 1) {
        const newCharIndex = val.length - 1;
        if (newCharIndex < targetText.length) {
            const typedChar = val[newCharIndex];
            const expectedChar = targetText[newCharIndex];
            
            if (typedChar !== expectedChar) {
                if (soundEnabled) playSound('error');
                setHardKeys(prev => {
                    const key = expectedChar === ' ' ? 'Space' : expectedChar;
                    return { ...prev, [key]: (prev[key] || 0) + 1 };
                });
            } else {
                if (soundEnabled) playSound('click');
            }
        }
    }

    setInput(val);
    setCurrIndex(val.length);
  };

  const focusInput = () => inputRef.current?.focus();
  const stats = calculateStats();
  const progressPercent = targetText.length === 0 ? 0 : Math.min(100, Math.round((input.length / targetText.length) * 100));
  const lineHeight = 1.65;
  
  let displayTime = Math.floor(stats.timeElapsed);
  if (timeLimit > 0) {
      displayTime = Math.max(0, timeLimit - Math.floor((Date.now() - (startTime || Date.now())) / 1000));
      if (!startTime) displayTime = timeLimit;
  }

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full min-h-0 items-center" onClick={focusInput}>
      {/* Stats Header */}
      <div className="w-full shrink-0 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700 py-2 px-4 md:px-6 mb-3 flex flex-col md:flex-row md:justify-between md:items-center rounded-2xl shadow-2xl gap-3">
        <div className="flex flex-wrap gap-3 md:gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{isSSC ? 'SSC Speed' : 'Net WPM'}</span>
                <span className={`text-2xl font-mono font-bold leading-none ${isSSC && stats.netWpm < 30 ? 'text-rose-400' : 'text-indigo-400'}`}>
                    {stats.netWpm}
                </span>
            </div>
            {!isSSC && (
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accuracy</span>
                    <span className={`${stats.accuracy > 95 ? 'text-emerald-400' : 'text-rose-400'} text-2xl font-mono font-bold leading-none`}>{stats.accuracy}%</span>
                </div>
            )}
            {isSSC && (
                 <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mistakes</span>
                    <span className="text-rose-400 text-2xl font-mono font-bold leading-none">{stats.incorrectChars}</span>
                </div>
            )}
            {!isSSC && (
                 <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mistakes</span>
                    <span className="text-rose-400 text-2xl font-mono font-bold leading-none">{stats.incorrectChars}</span>
                </div>
            )}
             <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{timeLimit > 0 ? 'Remaining' : 'Time'}</span>
                <span className={`${timeLimit > 0 && displayTime < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-200'} text-2xl font-mono font-bold leading-none`}>
                    {formatTime(displayTime)}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Progress</span>
                <span className="text-cyan-300 text-2xl font-mono font-bold leading-none">{progressPercent}%</span>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
             <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTextScale(prev => Math.max(20, prev - 2));
                }}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                title="Decrease text size"
             >
                A-
             </button>
             <span className="text-[10px] font-mono text-slate-500 min-w-7 text-center">{textScale}</span>
             <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTextScale(prev => Math.min(46, prev + 2));
                }}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                title="Increase text size"
             >
                A+
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
                className={`p-2 rounded-full transition-colors ${soundEnabled ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600'}`}
                title="Toggle Sound"
             >
                 {soundEnabled ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                 ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                 )}
             </button>
            <Button
                onClick={(e) => {
                  e.stopPropagation();
                  finishTestRef.current?.();
                }}
                variant="primary"
                className="!py-2 !px-4 text-xs font-bold uppercase tracking-wide"
                disabled={!startTime && input.length === 0}
            >
                Submit
            </Button>
            <Button onClick={(e) => { e.stopPropagation(); onRestart(); }} variant="secondary" className="!py-2 !px-4 text-xs font-bold uppercase tracking-wide">
                Back
            </Button>
        </div>
      </div>

      {/* Typing Container */}
      <div 
        ref={containerRef}
        className="w-full flex-1 min-h-0 relative bg-slate-800/30 rounded-2xl p-5 md:p-6 shadow-inner overflow-y-auto border border-slate-700/50"
        style={{
          perspective: '1000px',
        }}
      >
        {/* Floating Caret */}
        <div 
            className="absolute h-[3px] bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.85)] z-20 rounded-full"
            style={{ 
                width: caretPos.width,
                top: 0, 
                left: 0,
                transform: `translate(${caretPos.left}px, ${caretPos.top}px)`,
                transition: 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1)', 
                opacity: 1
            }}
        />

        <div
            className="whitespace-pre-wrap break-words min-h-full pb-12 relative z-10"
            style={{ fontSize: `${textScale}px`, lineHeight }}
        >
            {chars.map((char, index) => {
                let status: 'pending' | 'correct' | 'incorrect' = 'pending';
                if (index < input.length) {
                    status = input[index] === char ? 'correct' : 'incorrect';
                }
                
                return (
                    <CharItem 
                        key={index} 
                        index={index} 
                        char={char} 
                        status={status} 
                    />
                );
            })}
        </div>
        
        {/* Hidden Textarea (supports newline input) */}
        <textarea
            ref={inputRef}
            className="opacity-0 absolute inset-0 w-full h-full cursor-default z-30 pointer-events-none"
            value={input}
            onChange={handleInputChange}
            onBlur={focusInput}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            rows={1}
        />
        
        {!startTime && (
            <div className="absolute top-3 right-4 z-40 transition-opacity duration-300 pointer-events-none">
                <div className="text-[11px] text-slate-300 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1">
                    {isSSC ? 'SSC Exam Ready' : 'Type to start'}
                </div>
            </div>
        )}
      </div>

      <VirtualKeyboard nextChar={nextChar} />
    </div>
  );
};
