
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { TestResults, TimeLimit } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';
import { VirtualKeyboard } from './VirtualKeyboard';
import { playSound } from '../services/soundService';

const TYPING_TEXT_SCALE_KEY = 'snaptype_typing_text_scale_v1';
const WINDOW_PRE_CHARS = 900;
const WINDOW_POST_CHARS = 1800;
const ENTER_SYMBOL = '\u23CE';

const countLinearMismatches = (typed: string, expected: string): number => {
  let mismatches = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== expected[i]) {
      mismatches++;
    }
  }
  return mismatches;
};

const calculateSpeed = (
  totalChars: number,
  errors: number,
  effectiveMins: number
): { rawWpm: number; netWpm: number } => {
  return {
    rawWpm: Math.round((totalChars / 5) / effectiveMins),
    netWpm: Math.max(0, Math.round(((totalChars - errors) / 5) / effectiveMins)),
  };
};

interface TypingTestProps {
  text: string;
  timeLimit: TimeLimit;
  onComplete: (results: TestResults) => void;
  onRestart: () => void;
  isSSC?: boolean;
}

type CharStatus = 'pending' | 'correct' | 'incorrect';
interface DisplayChar {
  char: string;
  index: number;
}

interface DisplayToken {
  tokenKey: string;
  isWord: boolean;
  chars: DisplayChar[];
  startIndex: number;
  endIndex: number;
}

interface CharItemProps {
  char: string;
  status: CharStatus;
  index: number;
}

const CharItemBase: React.FC<CharItemProps> = ({ char, status, index }) => {
    const isNewline = char === '\n';
    let className = "relative font-mono transition-colors duration-75 inline-block ";
    
    if (status === 'pending') className += "text-slate-500";
    else if (status === 'correct') className += "text-emerald-400";
    else if (status === 'incorrect') className += "text-rose-500 bg-rose-500/20 rounded";

    return (
        <span data-char-idx={index} className={className}>
            {isNewline ? <span className="text-cyan-400/80">{ENTER_SYMBOL}</span> : char}
            {isNewline && <br/>}
        </span>
    );
};

const CharItem = React.memo(CharItemBase, (prev, next) => {
    return prev.status === next.status && prev.char === next.char && prev.index === next.index;
});

CharItemBase.displayName = 'CharItem';

interface TokenItemProps {
  token: DisplayToken;
  input: string;
  inputLength: number;
  inputRevision: number;
}

const TokenItemBase: React.FC<TokenItemProps> = ({ token, input }) => {
  const renderedChars = token.chars.map(({ char, index }) => {
    let status: CharStatus = 'pending';
    if (index < input.length) {
      status = input[index] === char ? 'correct' : 'incorrect';
    }

    return (
      <CharItem
        key={index}
        char={char}
        status={status}
        index={index}
      />
    );
  });

  if (token.isWord) {
    return <span className="inline-block align-top">{renderedChars}</span>;
  }
  return <>{renderedChars}</>;
};

const TokenItem = React.memo(TokenItemBase, (prev, next) => {
  if (prev.token !== next.token) return false;
  if (prev.inputRevision !== next.inputRevision) return false;

  const tokenStart = prev.token.startIndex;
  const tokenEnd = prev.token.endIndex;
  const prevLen = prev.inputLength;
  const nextLen = next.inputLength;

  // Token remains fully pending.
  if (prevLen <= tokenStart && nextLen <= tokenStart) return true;

  // Token is fully in the unchanged prefix region for append/backspace edits.
  if (tokenEnd < Math.min(prevLen, nextLen) - 1) return true;

  // Near cursor/partial overlap: allow re-render.
  return false;
});

TokenItemBase.displayName = 'TokenItem';

export const TypingTest: React.FC<TypingTestProps> = ({ text, timeLimit, onComplete, onRestart, isSSC = false }) => {
  const [input, setInput] = useState('');
  const [inputRevision, setInputRevision] = useState(0);
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
  const linearErrorsRef = useRef(0);
  
  // Tick state to force re-renders for timer
  const [, setTick] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(TYPING_TEXT_SCALE_KEY, String(textScale));
    } catch {
      // Ignore storage failures (private mode/quota restrictions).
    }
  }, [textScale]);

  // Memoize target text handling
  const targetText = useMemo(() => text.replace(/\r\n/g, "\n"), [text]);
  const chars = useMemo(() => targetText.split(''), [targetText]);
  const displayTokens = useMemo<DisplayToken[]>(() => {
    const rawTokens = targetText.match(/(\s+|[^\s]+)/g) || [];
    let nextIndex = 0;
    return rawTokens.map((token, tokenIndex) => {
      const startIndex = nextIndex;
      const charsInToken = token.split('').map(char => ({
        char,
        index: nextIndex++
      }));
      return {
        tokenKey: `${tokenIndex}-${charsInToken[0]?.index ?? tokenIndex}`,
        isWord: /\S/.test(token),
        chars: charsInToken,
        startIndex,
        endIndex: nextIndex - 1,
      };
    });
  }, [targetText]);
  const { windowStart, windowEnd } = useMemo(() => {
    const start = Math.max(0, currIndex - WINDOW_PRE_CHARS);
    const end = Math.min(targetText.length, currIndex + WINDOW_POST_CHARS);
    return { windowStart: start, windowEnd: end };
  }, [currIndex, targetText.length]);
  const windowedTokens = useMemo<DisplayToken[]>(() => {
    return displayTokens
      .filter(token => token.endIndex >= windowStart && token.startIndex < windowEnd)
      .map(token => {
        if (token.startIndex >= windowStart && token.endIndex < windowEnd) {
          return token;
        }
        const clippedChars = token.chars.filter(char => char.index >= windowStart && char.index < windowEnd);
        if (clippedChars.length === 0) return null;
        return {
          ...token,
          chars: clippedChars,
          startIndex: clippedChars[0].index,
          endIndex: clippedChars[clippedChars.length - 1].index,
        };
      })
      .filter((token): token is DisplayToken => token !== null);
  }, [displayTokens, windowStart, windowEnd]);
  const prefixText = useMemo(() => (windowStart > 0 ? targetText.slice(0, windowStart) : ''), [targetText, windowStart]);
  const suffixText = useMemo(() => (windowEnd < targetText.length ? targetText.slice(windowEnd) : ''), [targetText, windowEnd]);

  useEffect(() => {
    historyRef.current = [];
    linearErrorsRef.current = 0;
    hasCompletedRef.current = false;
    setInputRevision(0);
  }, [targetText]);

  // Next expected character for Virtual Keyboard
  const nextChar = useMemo(() => {
      if (currIndex >= targetText.length) return '';
      return targetText[currIndex];
  }, [currIndex, targetText]);

  // Stats calculation
  const calculateStats = useCallback((useLevenshtein = false): TestResults => {
    const timeNow = Date.now();
    const start = startTime || timeNow;
    
    let timeElapsedSecs = (timeNow - start) / 1000;
    if (timeLimit > 0 && timeElapsedSecs > timeLimit) {
        timeElapsedSecs = timeLimit;
    }

    const timeElapsedMins = timeElapsedSecs / 60;
    const effectiveMins = timeElapsedMins < 0.001 ? 0.001 : timeElapsedMins;
    
    const errors = useLevenshtein
      ? levenshteinDistance(input, targetText.slice(0, input.length))
      : linearErrorsRef.current;
    
    const correctChars = Math.max(0, input.length - errors);
    const missedWordsCount: Record<string, number> = {};

    const { rawWpm, netWpm } = calculateSpeed(input.length, errors, effectiveMins);

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
      typedText: input
    };
  }, [input, startTime, targetText, timeLimit, hardKeys]);

  const finishTest = useCallback(() => {
     if (hasCompletedRef.current) return;
     hasCompletedRef.current = true;
     const shouldUseLevenshtein = !isSSC && input.length > 0 && input.length <= 2500;
     const partialStats = calculateStats(shouldUseLevenshtein);
     
     // Full missed words calculation
     const missedWordsCount: Record<string, number> = {};
     const typedBoundaryText = targetText.slice(0, input.length);
     const wordsIterator = typedBoundaryText.matchAll(/(\S+)/g);
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
    
    const finalResults: TestResults = { ...partialStats, missedWords: missedWordsCount };

    if (isSSC) {
        const effectiveMins = Math.max(0.001, partialStats.timeElapsed / 60);
        const tentativeSpeed = (partialStats.totalChars / 5) / effectiveMins;
        const sscRawWpm = Math.round(tentativeSpeed);
        const sscNetWpm = Math.max(0, Math.round(tentativeSpeed - partialStats.incorrectChars));

        let sscMarks = 0;
        const speed = sscNetWpm;
        if (speed >= 30) sscMarks = 10;
        if (speed >= 31) sscMarks = 12;
        if (speed >= 36) sscMarks = 15;
        if (speed >= 41) sscMarks = 18;
        if (speed >= 46) sscMarks = 21;
        if (speed > 50) sscMarks = 25;

        finalResults.rawWpm = sscRawWpm;
        finalResults.netWpm = sscNetWpm;
        finalResults.isSSC = true;
        finalResults.sscMarks = sscMarks;
    }

    onComplete(finalResults);
  }, [calculateStats, input, targetText, onComplete, isSSC]);

  // Ref to hold the latest version of finishTest
  const finishTestRef = useRef(finishTest);
  useEffect(() => {
    finishTestRef.current = finishTest;
  }, [finishTest]);

  // Keep a stable stats callback for the interval loop.
  const calculateStatsRef = useRef(calculateStats);
  useEffect(() => {
    calculateStatsRef.current = calculateStats;
  }, [calculateStats]);

  // Real-time update loop (Timer & History)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (startTime) {
      interval = setInterval(() => {
        if (hasCompletedRef.current) return;
        setTick(t => t + 1);
        
        const stats = calculateStatsRef.current(false);
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
            if (historyRef.current.length > 1800) {
              historyRef.current.splice(0, historyRef.current.length - 1800);
            }
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
  }, [startTime, timeLimit]);

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
          const cursorEl = container.querySelector(`[data-char-idx="${charIndexToMeasure}"]`) as HTMLSpanElement | null;
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
    if (hasCompletedRef.current) return;
    const val = e.target.value.slice(0, targetText.length);
    const prevInput = input;
    if (!startTime) setStartTime(Date.now());
    const isAppend = val.length >= prevInput.length && val.startsWith(prevInput);
    const isTrim = val.length < prevInput.length && prevInput.startsWith(val);
    if (!isAppend && !isTrim) {
      setInputRevision(rev => rev + 1);
    }

    // Keep a cheap running mismatch count for live stats.
    let nextLinearErrors = linearErrorsRef.current;
    if (val.length >= prevInput.length && val.startsWith(prevInput)) {
      for (let i = prevInput.length; i < val.length; i++) {
        if (val[i] !== targetText[i]) nextLinearErrors += 1;
      }
    } else if (val.length < prevInput.length && prevInput.startsWith(val)) {
      for (let i = val.length; i < prevInput.length; i++) {
        if (prevInput[i] !== targetText[i]) nextLinearErrors -= 1;
      }
      nextLinearErrors = Math.max(0, nextLinearErrors);
    } else {
      nextLinearErrors = countLinearMismatches(val, targetText.slice(0, val.length));
    }
    linearErrorsRef.current = nextLinearErrors;

    // Sound and Logic for new keystroke
    if (val.length === input.length + 1) {
        const newCharIndex = val.length - 1;
        if (newCharIndex < targetText.length) {
            const typedChar = val[newCharIndex];
            const expectedChar = targetText[newCharIndex];
            
            if (typedChar !== expectedChar) {
                if (soundEnabled) playSound('error');
                setHardKeys(prev => {
                    const key = expectedChar === ' '
                      ? 'Space'
                      : expectedChar === '\n'
                        ? 'Enter'
                        : expectedChar;
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
  const stats = calculateStats(false);
  const progressPercent = targetText.length === 0 ? 0 : Math.min(100, Math.round((input.length / targetText.length) * 100));
  const lineHeight = 1.65;
  const showVirtualKeyboard = targetText.length <= 8000;
  
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
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net WPM</span>
                <span className="text-2xl font-mono font-bold leading-none text-indigo-400">
                    {stats.netWpm}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accuracy</span>
                <span className={`${stats.accuracy > 95 ? 'text-emerald-400' : 'text-rose-400'} text-2xl font-mono font-bold leading-none`}>{stats.accuracy}%</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mistakes</span>
                <span className="text-rose-400 text-2xl font-mono font-bold leading-none">{stats.incorrectChars}</span>
            </div>
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
                aria-label="Toggle Sound"
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
            className="whitespace-pre-wrap break-normal min-h-full pb-12 relative z-10 [word-break:normal] [overflow-wrap:normal]"
            style={{ fontSize: `${textScale}px`, lineHeight }}
        >
            {prefixText && <span className="text-slate-500/90">{prefixText}</span>}
            {windowedTokens.map(token => {
                return (
                    <TokenItem
                      key={token.tokenKey}
                      token={token}
                      input={input}
                      inputLength={input.length}
                      inputRevision={inputRevision}
                    />
                );
            })}
            {suffixText && <span className="text-slate-500/90">{suffixText}</span>}
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
                    Type to start
                </div>
            </div>
        )}
      </div>

      {showVirtualKeyboard && <VirtualKeyboard nextChar={nextChar} />}
    </div>
  );
};
