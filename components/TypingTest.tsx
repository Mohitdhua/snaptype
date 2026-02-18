
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { TestResults, TimeLimit } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';
import { VirtualKeyboard } from './VirtualKeyboard';
import { playSound } from '../services/soundService';

interface TypingTestProps {
  text: string;
  timeLimit: TimeLimit;
  onComplete: (results: TestResults) => void;
  onRestart: () => void;
  isSSC?: boolean;
}

// Memoized char item
const CharItem = React.memo(({ char, status, index }: { char: string, status: 'pending' | 'correct' | 'incorrect', index: number }) => {
    let className = "relative font-mono text-2xl md:text-3xl leading-relaxed transition-colors duration-75 inline-block ";
    
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
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // History tracking
  const historyRef = useRef<{ time: number; wpm: number; raw: number; accuracy: number }[]>([]);
  
  // Tick state to force re-renders for timer
  const [, setTick] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Update Caret Position & Typewriter Scroll
  useEffect(() => {
      const rafId = requestAnimationFrame(() => {
          const container = containerRef.current;
          const charIndexToMeasure = Math.min(currIndex, targetText.length - 1);
          const cursorEl = document.getElementById(`char-${charIndexToMeasure}`);

          if (container && cursorEl) {
              
              let newTop = cursorEl.offsetTop;
              let newLeft = cursorEl.offsetLeft;
              const cursorWidth = cursorEl.offsetWidth;
              const cursorHeight = cursorEl.offsetHeight;

              if (currIndex === targetText.length) {
                 newLeft += cursorWidth;
              }

              const containerHeight = container.clientHeight;
              const targetScroll = newTop - (containerHeight / 2) + (cursorHeight / 2);
              
              container.scrollTop = targetScroll;
              
              setCaretPos({ top: newTop, left: newLeft });
          }
      });
      return () => cancelAnimationFrame(rafId);
  }, [currIndex, targetText.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());

    // Sound and Logic for new keystroke
    if (val.length > input.length) {
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

    if (val.length <= targetText.length) {
        setInput(val);
        setCurrIndex(val.length);
    }
  };

  const focusInput = () => inputRef.current?.focus();
  const stats = calculateStats();
  
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
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full items-center" onClick={focusInput}>
      {/* Stats Header */}
      <div className="w-full sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 py-3 px-6 mb-6 flex justify-between items-center rounded-b-2xl shadow-2xl">
        <div className="flex gap-4 md:gap-8">
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
             <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{timeLimit > 0 ? 'Remaining' : 'Time'}</span>
                <span className={`${timeLimit > 0 && displayTime < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-200'} text-2xl font-mono font-bold leading-none`}>
                    {formatTime(displayTime)}
                </span>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
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
            <Button onClick={(e) => { e.stopPropagation(); onRestart(); }} variant="secondary" className="!py-2 !px-4 text-xs font-bold uppercase tracking-wide">
                Restart
            </Button>
        </div>
      </div>

      {/* Typing Container */}
      <div 
        ref={containerRef}
        className="w-full flex-1 relative bg-slate-800/30 rounded-3xl p-8 md:p-12 shadow-inner overflow-hidden border border-slate-700/50 min-h-[300px]"
        style={{ perspective: '1000px' }}
      >
        {/* Floating Caret */}
        <div 
            className="absolute w-[2px] h-8 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] z-20 rounded-full"
            style={{ 
                top: 0, 
                left: 0,
                transform: `translate(${caretPos.left}px, ${caretPos.top}px)`,
                transition: 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1)', 
                opacity: startTime ? 1 : 0
            }}
        />

        <div className="whitespace-pre-wrap break-words min-h-full pb-64 relative z-10">
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
        
        {/* Hidden Input */}
        <input
            ref={inputRef}
            type="text"
            className="opacity-0 absolute inset-0 w-full h-full cursor-default z-30"
            value={input}
            onChange={handleInputChange}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
        />
        
        {!startTime && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] z-40 transition-opacity duration-300">
                <div className="text-center">
                    <div className="text-slate-200 text-xl font-medium mb-2">Click or Type to Start</div>
                    <div className="text-slate-400 text-sm">{isSSC ? 'SSC Exam Mode (10 Mins)' : 'Focus mode enabled'}</div>
                </div>
            </div>
        )}
      </div>

      <VirtualKeyboard nextChar={nextChar} />
    </div>
  );
};
