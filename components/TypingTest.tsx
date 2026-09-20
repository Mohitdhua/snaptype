import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { HardcoreMode, TestResults, TimeLimit, GhostPacerMode } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';
import { VirtualKeyboard } from './VirtualKeyboard';
import { HandsGuide } from './HandsGuide';
import { playSound, playKeystrokeSound, getSoundProfile, setSoundProfile, SoundProfile, startMetronome, stopMetronome } from '../services/soundService';
import { getUserStats } from '../services/storageService';

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
  lessonId?: string;
  initialHardcoreMode?: HardcoreMode;
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
    
    if (status === 'pending') {
      className += "text-neutral-500/85";
    } else if (status === 'correct') {
      className += "text-neutral-100 font-medium";
    } else if (status === 'incorrect') {
      className += "text-rose-400 bg-rose-500/20 border-b-2 border-rose-500/90 rounded-[2px]";
    }

    return (
        <span data-char-idx={index} className={className}>
            {isNewline ? (
              <span className={status === 'pending' ? "text-neutral-600/70 font-sans text-[0.8em]" : "text-indigo-400 font-sans text-[0.8em]"}>
                {ENTER_SYMBOL}
              </span>
            ) : char}
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
    return <span className="inline-block whitespace-nowrap">{renderedChars}</span>;
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

export const TypingTest: React.FC<TypingTestProps> = ({
  text,
  timeLimit,
  onComplete,
  onRestart,
  isSSC = false,
  lessonId,
  initialHardcoreMode = 'NONE'
}) => {
  const [input, setInput] = useState('');
  const [inputRevision, setInputRevision] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currIndex, setCurrIndex] = useState(0);
  const [hardKeys, setHardKeys] = useState<Record<string, number>>({});
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0, width: 2.5, height: 32 });
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showHands, setShowHands] = useState(false);
  const [hardcoreMode, setHardcoreMode] = useState<HardcoreMode>(initialHardcoreMode);
  const [backspaceBlockedToast, setBackspaceBlockedToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHardcoreMode(initialHardcoreMode);
  }, [initialHardcoreMode, text]);
  const [soundProfile, setSoundProfileState] = useState<SoundProfile>(() => getSoundProfile());
  const [caretStyle, setCaretStyle] = useState<'line' | 'block' | 'underline'>('line');
  const [isZenMode, setIsZenMode] = useState(false);
  const [hasErrorShake, setHasErrorShake] = useState(false);
  const [pacerMode, setPacerMode] = useState<GhostPacerMode>('OFF');
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);

  // Latency & reaction time tracking refs
  const lastKeystrokeTimeRef = useRef<number | null>(null);
  const keyLatenciesRef = useRef<Record<string, { totalMs: number; count: number }>>({});
  const totalLatencyMsRef = useRef(0);
  const latencyCountRef = useRef(0);
  const userStatsRef = useRef(getUserStats());
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
  
  // History and Keystroke Tracking
  const historyRef = useRef<{ time: number; wpm: number; raw: number; accuracy: number }[]>([]);
  const linearErrorsRef = useRef(0);
  const totalKeystrokesRef = useRef<number>(0);
  const totalRawErrorsRef = useRef<number>(0);
  const backspaceCountRef = useRef<number>(0);
  const correctedErrorsRef = useRef<number>(0);
  
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
    totalKeystrokesRef.current = 0;
    totalRawErrorsRef.current = 0;
    backspaceCountRef.current = 0;
    correctedErrorsRef.current = 0;
    hasCompletedRef.current = false;
    setInputRevision(0);
  }, [targetText]);

  // Next expected character for Virtual Keyboard & hands guide
  const nextChar = useMemo(() => {
    if (currIndex >= targetText.length) return '';
    return targetText[currIndex];
  }, [currIndex, targetText]);

  // Target speed for Ghost Pacer
  const ghostTargetWpm = useMemo(() => {
    if (pacerMode === '30_WPM') return 30;
    if (pacerMode === '35_WPM') return 35;
    if (pacerMode === '40_WPM') return 40;
    if (pacerMode === '50_WPM') return 50;
    if (pacerMode === 'PERSONAL_BEST') return Math.max(30, userStatsRef.current.bestWpm || 35);
    return 0;
  }, [pacerMode]);

  // Metronome sync effect
  useEffect(() => {
    if (isMetronomeOn && startTime && !hasCompletedRef.current) {
      const targetSpeed = ghostTargetWpm > 0 ? ghostTargetWpm : 35;
      startMetronome(targetSpeed);
    } else {
      stopMetronome();
    }
    return () => {
      stopMetronome();
    };
  }, [isMetronomeOn, startTime, ghostTargetWpm]);

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

    // Real keystroke accuracy taking all mistakes into account (including corrected via backspace)
    const totalKeystrokes = Math.max(input.length, totalKeystrokesRef.current);
    const totalRawErrors = totalRawErrorsRef.current;
    const realAccuracy = totalKeystrokes > 0
      ? Math.max(0, Math.min(100, Math.round(((totalKeystrokes - totalRawErrors) / totalKeystrokes) * 100)))
      : 100;

    return {
      netWpm,
      rawWpm,
      accuracy,
      realAccuracy,
      totalKeystrokes,
      totalRawErrors,
      backspaceCount: backspaceCountRef.current,
      correctedErrors: correctedErrorsRef.current,
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
    
    stopMetronome();
    const avgLatencyMs = latencyCountRef.current > 0
      ? Math.round(totalLatencyMsRef.current / latencyCountRef.current)
      : undefined;
    const keyLatencies: Record<string, number> = {};
    for (const [k, v] of Object.entries(keyLatenciesRef.current) as [string, { totalMs: number; count: number }][]) {
      if (v.count >= 2) {
        keyLatencies[k] = Math.round(v.totalMs / v.count);
      }
    }

    const finalResults: TestResults = {
      ...partialStats,
      missedWords: missedWordsCount,
      avgLatencyMs,
      keyLatencies: Object.keys(keyLatencies).length > 0 ? keyLatencies : undefined,
      pacerMode,
      ghostWpm: ghostTargetWpm > 0 ? ghostTargetWpm : undefined,
    };

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

  // Keep caret aligned to the active character and scroll smoothly when needed.
  const updateCaret = useCallback(() => {
    const container = containerRef.current;
    if (!container || chars.length === 0) return;

    const charIndexToMeasure = Math.min(currIndex, chars.length - 1);
    const cursorEl = container.querySelector(`[data-char-idx="${charIndexToMeasure}"]`) as HTMLSpanElement | null;
    if (!cursorEl) return;

    // First check if auto-scrolling is needed to keep the cursor in view
    const initialContainerRect = container.getBoundingClientRect();
    const initialCursorRect = cursorEl.getBoundingClientRect();

    const topMargin = 32;
    const bottomMargin = 52;
    const cursorTopInView = initialCursorRect.top - initialContainerRect.top;
    const cursorBottomInView = initialCursorRect.bottom - initialContainerRect.top;

    if (cursorBottomInView > container.clientHeight - bottomMargin) {
      container.scrollTop += (cursorBottomInView - (container.clientHeight - bottomMargin));
    } else if (cursorTopInView < topMargin) {
      container.scrollTop -= (topMargin - cursorTopInView);
    }

    // Always re-measure fresh rects AFTER any potential scroll adjustment
    const containerRect = container.getBoundingClientRect();
    const cursorRect = cursorEl.getBoundingClientRect();

    let newLeft = cursorRect.left - containerRect.left + container.scrollLeft;
    if (currIndex >= chars.length) {
      newLeft += cursorRect.width;
    }

    const caretHeight = Math.max(16, Math.round(textScale * 0.9));
    const caretTop = cursorRect.top - containerRect.top + container.scrollTop + (cursorRect.height - caretHeight) / 2;

    setCaretPos({ top: caretTop, left: newLeft, width: 2.5, height: caretHeight });
  }, [currIndex, chars.length, textScale]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updateCaret);
    return () => cancelAnimationFrame(rafId);
  }, [updateCaret]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateCaret, { passive: true });
    return () => container.removeEventListener('scroll', updateCaret);
  }, [updateCaret]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (hasCompletedRef.current) return;
    const val = e.target.value.slice(0, targetText.length);
    const prevInput = input;
    if (!startTime) setStartTime(Date.now());

    // Enforce NO_BACKSPACE mode
    if (hardcoreMode === 'NO_BACKSPACE' && val.length < prevInput.length) {
      if (soundProfile !== 'off') playSound('error');
      setHasErrorShake(true);
      setBackspaceBlockedToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setBackspaceBlockedToast(false), 1400);
      setTimeout(() => setHasErrorShake(false), 180);
      return;
    }

    // Enforce STOP_ON_ERROR mode
    if (hardcoreMode === 'STOP_ON_ERROR' && val.length > prevInput.length) {
      const newCharIndex = val.length - 1;
      if (newCharIndex < targetText.length && val[newCharIndex] !== targetText[newCharIndex]) {
        if (soundProfile !== 'off') playSound('error');
        setHasErrorShake(true);
        setTimeout(() => setHasErrorShake(false), 180);
        const expectedChar = targetText[newCharIndex];
        const key = expectedChar === ' ' ? 'Space' : expectedChar === '\n' ? 'Enter' : expectedChar;
        setHardKeys(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        return;
      }
    }

    // Enforce SUDDEN_DEATH mode
    if (hardcoreMode === 'SUDDEN_DEATH' && val.length > prevInput.length) {
      const newCharIndex = val.length - 1;
      if (newCharIndex < targetText.length && val[newCharIndex] !== targetText[newCharIndex]) {
        if (soundProfile !== 'off') playSound('error');
        setHasErrorShake(true);
        setInput(val);
        setCurrIndex(val.length);
        setTimeout(() => {
          finishTestRef.current?.();
        }, 80);
        return;
      }
    }

    const isAppend = val.length >= prevInput.length && val.startsWith(prevInput);
    const isTrim = val.length < prevInput.length && prevInput.startsWith(val);
    if (!isAppend && !isTrim) {
      setInputRevision(rev => rev + 1);
    }

    if (val.length > prevInput.length) {
      const addedChars = val.length - prevInput.length;
      totalKeystrokesRef.current += addedChars;
      for (let i = prevInput.length; i < val.length; i++) {
        if (i < targetText.length && val[i] !== targetText[i]) {
          totalRawErrorsRef.current += 1;
        }
      }
    } else if (val.length < prevInput.length) {
      const removedChars = prevInput.length - val.length;
      backspaceCountRef.current += removedChars;
      for (let i = val.length; i < prevInput.length; i++) {
        if (i < targetText.length && prevInput[i] !== targetText[i]) {
          correctedErrorsRef.current += 1;
        }
      }
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

    // Sound, latency and logic for new keystroke
    if (val.length === input.length + 1) {
        const newCharIndex = val.length - 1;
        if (newCharIndex < targetText.length) {
            const typedChar = val[newCharIndex];
            const expectedChar = targetText[newCharIndex];

            // Measure inter-keystroke interval
            const nowTime = Date.now();
            if (lastKeystrokeTimeRef.current !== null) {
              const delta = nowTime - lastKeystrokeTimeRef.current;
              if (delta >= 15 && delta <= 2500) {
                totalLatencyMsRef.current += delta;
                latencyCountRef.current++;
                const expectedKey = expectedChar === ' ' ? 'Space' : expectedChar.toLowerCase();
                if (!keyLatenciesRef.current[expectedKey]) {
                  keyLatenciesRef.current[expectedKey] = { totalMs: 0, count: 0 };
                }
                keyLatenciesRef.current[expectedKey].totalMs += delta;
                keyLatenciesRef.current[expectedKey].count++;
              }
            }
            lastKeystrokeTimeRef.current = nowTime;
            
            if (typedChar !== expectedChar) {
                if (soundProfile !== 'off') playSound('error');
                setHasErrorShake(true);
                setTimeout(() => setHasErrorShake(false), 180);
                setHardKeys(prev => {
                    const key = expectedChar === ' '
                      ? 'Space'
                      : expectedChar === '\n'
                        ? 'Enter'
                        : expectedChar;
                    return { ...prev, [key]: (prev[key] || 0) + 1 };
                });
            } else {
                if (soundProfile !== 'off') playKeystrokeSound(soundProfile, typedChar === '\n');
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
  const showVirtualKeyboard = showKeyboard && targetText.length <= 8000;
  
  // Ghost Pacer tracking calculations
  const ghostChars = useMemo(() => {
    if (ghostTargetWpm <= 0 || !startTime) return 0;
    const elapsedSecs = stats.timeElapsed;
    return Math.floor((elapsedSecs / 60) * ghostTargetWpm * 5);
  }, [ghostTargetWpm, startTime, stats.timeElapsed]);

  const ghostProgressPercent = targetText.length === 0
    ? 0
    : Math.min(100, Math.round((ghostChars / targetText.length) * 100));

  const pacerDiff = ghostTargetWpm > 0 ? stats.netWpm - ghostTargetWpm : 0;

  let displayTime = Math.floor(stats.timeElapsed);
  if (timeLimit > 0) {
      displayTime = Math.max(0, timeLimit - Math.floor((Date.now() - (startTime || Date.now())) / 1000));
      if (!startTime) displayTime = timeLimit;
  }

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [onRestart]);

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full min-h-0 items-center animate-fade-in" onClick={focusInput}>
      {/* Floating Glass Bento HUD */}
      {isZenMode ? (
        <div className="w-full shrink-0 z-40 bento-card bg-neutral-950/80 backdrop-blur-xl border border-white/10 py-2.5 px-5 mb-4 flex items-center justify-between rounded-2xl shadow-xl">
          <div className="flex items-center gap-6 font-mono text-sm">
            <span className="text-white font-bold">{stats.netWpm} WPM</span>
            <span className={stats.accuracy >= 95 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {stats.accuracy}% ACC {stats.realAccuracy !== undefined && stats.realAccuracy !== stats.accuracy ? `(${stats.realAccuracy}% real)` : ''}
            </span>
            <span className="text-neutral-400">{formatTime(displayTime)}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setIsZenMode(false); }}
            className="text-xs font-mono px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
          >
            Exit Zen Mode
          </button>
        </div>
      ) : (
      <div className="w-full shrink-0 z-40 bento-card bg-neutral-950/80 backdrop-blur-xl border border-white/10 py-3 px-5 md:px-7 mb-4 flex flex-col md:flex-row md:justify-between md:items-center rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] gap-4">
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-7 w-full md:w-auto">
          {/* Net WPM */}
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Net WPM
            </span>
            <span className="text-3xl font-mono font-black tracking-tight text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.35)] leading-none mt-1">
              {stats.netWpm}
            </span>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {/* Accuracy */}
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Accuracy</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-3xl font-mono font-black tracking-tight leading-none ${
                stats.accuracy >= 97 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]' :
                stats.accuracy >= 90 ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]' :
                'text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.3)]'
              }`}>
                {stats.accuracy}%
              </span>
              {stats.realAccuracy !== undefined && stats.realAccuracy !== stats.accuracy && (
                <span className="text-[10px] font-mono text-neutral-400 font-medium" title="Real Keystroke Accuracy before Backspace">
                  ({stats.realAccuracy}% real)
                </span>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {/* Mistakes */}
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Errors</span>
            <span className={`text-2xl font-mono font-bold leading-none mt-1 ${stats.incorrectChars > 0 ? 'text-rose-400' : 'text-neutral-500'}`}>
              {stats.incorrectChars}
            </span>
          </div>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          {/* Timer */}
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
              {timeLimit > 0 ? 'Remaining' : 'Time'}
            </span>
            <span className={`text-2xl font-mono font-bold leading-none mt-1 ${
              timeLimit > 0 && displayTime < 10 ? 'text-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-neutral-200'
            }`}>
              {formatTime(displayTime)}
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Progress</span>
            <span className="text-xl font-mono font-bold text-neutral-300 leading-none mt-1">
              {progressPercent}%
            </span>
          </div>

          {/* KDPH Indicator */}
          <div className="hidden xl:flex flex-col">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Rate (KDPH)</span>
            <span className="text-xl font-mono font-bold text-indigo-300 leading-none mt-1">
              {stats.kdph || 0}
            </span>
          </div>
        </div>
        
        {/* Quick Controls & Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3 w-full md:w-auto pt-2 md:pt-0 border-t border-white/5 md:border-t-0">
          {/* Text Size Stepper */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5" title="Adjust text size">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTextScale(prev => Math.max(20, prev - 2));
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors"
              title="Decrease text size"
            >
              -
            </button>
            <span className="text-[11px] font-mono text-neutral-400 px-2 min-w-8 text-center select-none font-semibold">
              {textScale}px
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTextScale(prev => Math.min(46, prev + 2));
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-colors"
              title="Increase text size"
            >
              +
            </button>
          </div>

          {/* Sound Profile Selector */}
          <div className="relative" title="Switch Keyboard Audio Profile">
            <select
              value={soundProfile}
              onChange={(e) => {
                e.stopPropagation();
                const next = e.target.value as SoundProfile;
                setSoundProfileState(next);
                setSoundProfile(next);
                playKeystrokeSound(next);
              }}
              className="text-[11px] font-mono font-semibold px-2.5 py-1.5 rounded-xl border bg-white/5 border-white/10 text-neutral-300 hover:text-white cursor-pointer appearance-none pr-5 transition-all"
            >
              <option value="cherry-blue" className="bg-neutral-900 text-white">Cherry Blue (Clicky)</option>
              <option value="cherry-brown" className="bg-neutral-900 text-white">Cherry Brown (Tactile)</option>
              <option value="topre" className="bg-neutral-900 text-white">Topre (Thock)</option>
              <option value="typewriter" className="bg-neutral-900 text-white">Typewriter</option>
              <option value="soft" className="bg-neutral-900 text-white">Soft Bubble</option>
              <option value="off" className="bg-neutral-900 text-white">Sound Muted</option>
            </select>
          </div>

          {/* Caret Style Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCaretStyle(prev => prev === 'line' ? 'block' : prev === 'block' ? 'underline' : 'line');
            }}
            className="text-[10px] font-mono px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Toggle Caret Style (Line / Block / Underline)"
          >
            Caret: {caretStyle.toUpperCase()}
          </button>

          {/* Zen Focus Mode Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZenMode(prev => !prev);
            }}
            className={`p-2 rounded-xl border transition-all ${
              isZenMode 
                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]' 
                : 'bg-white/5 border-white/10 text-neutral-500 hover:text-neutral-300'
            }`}
            title={isZenMode ? 'Exit Zen Focus Mode' : 'Enter Zen Focus Mode (Distraction-Free)'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Virtual Keyboard Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowKeyboard(prev => !prev); }}
            className={`p-2 rounded-xl border transition-all duration-150 ${
              showKeyboard 
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' 
                : 'bg-white/5 border-white/10 text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label="Toggle Virtual Keyboard"
            title={showKeyboard ? 'Hide virtual keyboard' : 'Show virtual keyboard'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m4 0h1M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
          </button>

          {/* Hands Guide Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowHands(prev => !prev); }}
            className={`p-2 rounded-xl border transition-all duration-150 ${
              showHands 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]' 
                : 'bg-white/5 border-white/10 text-neutral-500 hover:text-neutral-300'
            }`}
            aria-label="Toggle Hands Guide"
            title={showHands ? 'Hide Finger Placement Guide' : 'Show Finger Placement Guide'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </button>

          {/* Ghost Pacer Target Selector */}
          <div className="relative" title="Ghost Speed Pacer">
            <select
              value={pacerMode}
              onChange={(e) => {
                e.stopPropagation();
                setPacerMode(e.target.value as GhostPacerMode);
              }}
              className={`text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-xl border appearance-none pr-5 cursor-pointer transition-all ${
                pacerMode === 'OFF'
                  ? 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  : 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
              }`}
            >
              <option value="OFF" className="bg-neutral-900 text-white">Ghost: OFF</option>
              <option value="30_WPM" className="bg-neutral-900 text-white">Ghost: 30 WPM (SSC)</option>
              <option value="35_WPM" className="bg-neutral-900 text-white">Ghost: 35 WPM (Clerk)</option>
              <option value="40_WPM" className="bg-neutral-900 text-white">Ghost: 40 WPM (Goal)</option>
              <option value="50_WPM" className="bg-neutral-900 text-white">Ghost: 50 WPM (Pro)</option>
              <option value="PERSONAL_BEST" className="bg-neutral-900 text-white">Ghost: Personal Best</option>
            </select>
          </div>

          {/* Audio Metronome Cadence Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMetronomeOn(prev => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-all flex items-center gap-1 ${
              isMetronomeOn
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title="Audio Cadence Metronome (Helps rhythm & prevents erratic bursts)"
          >
            <span>🎵</span>
            <span>{isMetronomeOn ? 'BPM ON' : 'BPM'}</span>
          </button>

          {/* Quick Backspace Lock / Accuracy-First Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHardcoreMode(prev => prev === 'NO_BACKSPACE' ? 'NONE' : 'NO_BACKSPACE');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-all flex items-center gap-1 ${
              hardcoreMode === 'NO_BACKSPACE'
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
            }`}
            title={hardcoreMode === 'NO_BACKSPACE' ? 'Accuracy-First Active (Backspace Blocked)' : 'Enable Accuracy-First Mode (Block Backspace to build real muscle precision)'}
          >
            <span>{hardcoreMode === 'NO_BACKSPACE' ? '🛡️ No ⌫' : '⌫ Normal'}</span>
          </button>

          {/* Hardcore Mode Selector */}
          <div className="relative" title="Typing Mode">
            <select
              value={hardcoreMode}
              onChange={(e) => {
                e.stopPropagation();
                setHardcoreMode(e.target.value as HardcoreMode);
              }}
              className={`text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-xl border appearance-none pr-5 cursor-pointer transition-all ${
                hardcoreMode === 'NONE'
                  ? 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  : hardcoreMode === 'SUDDEN_DEATH'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : hardcoreMode === 'NO_BACKSPACE'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
              }`}
            >
              <option value="NONE" className="bg-neutral-900 text-white">Standard Mode</option>
              <option value="NO_BACKSPACE" className="bg-neutral-900 text-white">🛡️ No Backspace</option>
              <option value="SUDDEN_DEATH" className="bg-neutral-900 text-white">💀 Sudden Death</option>
              <option value="STOP_ON_ERROR" className="bg-neutral-900 text-white">🛑 Stop on Error</option>
            </select>
          </div>

          {/* Submit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              finishTestRef.current?.();
            }}
            disabled={!startTime && input.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <span>Submit</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono font-normal bg-black/10 px-1 py-0.5 rounded text-neutral-700">Ctrl+↵</kbd>
          </button>

          {/* Exit / Back */}
          <button 
            onClick={(e) => { e.stopPropagation(); onRestart(); }} 
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <span>Exit</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono font-normal bg-white/10 px-1 py-0.5 rounded text-neutral-400">Esc</kbd>
          </button>
        </div>
      </div>
      )}

      {/* Dual Live Ghost Race Track (when Pacer is Active) */}
      {pacerMode !== 'OFF' && (
        <div className="w-full shrink-0 bento-card bg-neutral-950/70 border border-purple-500/30 p-3 px-5 mb-3 rounded-2xl flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-base">🏎️</span>
              <span className="font-bold text-white">Live Ghost Race</span>
              <span className="text-neutral-400">vs {ghostTargetWpm} WPM Pacer</span>
            </div>
            <div className="flex items-center gap-2">
              {pacerDiff >= 0 ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  +{pacerDiff} WPM Ahead ⚡
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {pacerDiff} WPM Behind ⚠️
                </span>
              )}
            </div>
          </div>

          {/* Race Track Lines */}
          <div className="flex flex-col gap-1.5">
            {/* User Track */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-cyan-300 w-12 shrink-0 font-bold">You</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 w-10 text-right">{stats.netWpm} WPM</span>
            </div>

            {/* Ghost Track */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-purple-300 w-12 shrink-0 font-bold">Ghost</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300 rounded-full opacity-80"
                  style={{ width: `${ghostProgressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 w-10 text-right">{ghostTargetWpm} WPM</span>
            </div>
          </div>
        </div>
      )}

      {/* Accuracy First Banner / Notification */}
      {hardcoreMode === 'NO_BACKSPACE' && (
        <div className="w-full shrink-0 flex items-center justify-between px-4 py-2 mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span className="font-bold">Accuracy-First Training Mode:</span>
            <span className="text-neutral-300 hidden sm:inline">Backspace disabled to force 96%+ raw muscle precision. Feel each key before pressing.</span>
          </div>
          {backspaceBlockedToast ? (
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 animate-pulse text-[11px]">
              ⌫ Backspace Blocked! Press forward.
            </span>
          ) : (
            <span className="text-[10px] text-amber-400/80 uppercase tracking-widest hidden md:inline">
              Real Accuracy Mode
            </span>
          )}
        </div>
      )}

      {/* Typing Card Wrapper with top Progress Bar */}
      <div className={`w-full flex-1 min-h-0 flex flex-col bento-card bg-neutral-950/60 backdrop-blur-2xl rounded-3xl border border-white/10 hover:border-white/15 transition-all duration-150 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden ${
        hasErrorShake ? 'animate-shake border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.3)]' : ''
      }`}>
        {/* Sleek Progress Line fixed at the very top edge of the card */}
        <div className="w-full h-1 bg-white/5 shrink-0 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 transition-all duration-150 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Scrollable Text Viewport */}
        <div 
          ref={containerRef}
          className="w-full flex-1 min-h-0 relative p-6 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600"
        >
          {/* Caret Styles */}
          {caretStyle === 'line' && (
            <div 
              className="absolute w-[2.5px] bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.95),0_0_4px_rgba(99,102,241,1)] z-20 rounded-full animate-caret-pulse pointer-events-none"
              style={{ 
                height: caretPos.height || textScale * 1.15,
                top: 0, 
                left: 0,
                transform: `translate(${caretPos.left}px, ${caretPos.top}px)`,
                transition: 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)', 
              }}
            />
          )}
          {caretStyle === 'block' && (
            <div 
              className="absolute bg-indigo-400/35 border border-indigo-400/80 shadow-[0_0_10px_rgba(99,102,241,0.5)] z-20 rounded-sm animate-caret-pulse pointer-events-none"
              style={{ 
                width: Math.max(13, textScale * 0.58),
                height: caretPos.height || textScale * 1.15,
                top: 0, 
                left: 0,
                transform: `translate(${caretPos.left}px, ${caretPos.top}px)`,
                transition: 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)', 
              }}
            />
          )}
          {caretStyle === 'underline' && (
            <div 
              className="absolute h-[3px] bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)] z-20 rounded-full animate-caret-pulse pointer-events-none"
              style={{ 
                width: Math.max(13, textScale * 0.58),
                top: 0, 
                left: 0,
                transform: `translate(${caretPos.left}px, ${caretPos.top + (caretPos.height || textScale * 1.15) - 3}px)`,
                transition: 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)', 
              }}
            />
          )}

          {/* Text Rendering Flow */}
          <div
            className="whitespace-pre-wrap break-normal min-h-full pb-20 relative z-10 font-mono typing-text-flow select-none [word-break:normal] [overflow-wrap:normal]"
            style={{ fontSize: `${textScale}px`, lineHeight }}
          >
            {prefixText && <span className="text-neutral-500/85">{prefixText}</span>}
            {windowedTokens.map(token => (
              <TokenItem
                key={token.tokenKey}
                token={token}
                input={input}
                inputLength={input.length}
                inputRevision={inputRevision}
              />
            ))}
            {suffixText && <span className="text-neutral-500/85">{suffixText}</span>}
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
            <div className="absolute top-4 right-6 z-40 transition-opacity duration-300 pointer-events-none">
              <div className="text-xs font-mono text-neutral-300 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 shadow-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Type to begin
              </div>
            </div>
          )}
        </div>
      </div>

      {!isZenMode && showHands && (
        <div className="w-full max-w-4xl mx-auto flex justify-center py-2">
          <HandsGuide nextChar={nextChar} />
        </div>
      )}

      {!isZenMode && showVirtualKeyboard && <VirtualKeyboard nextChar={nextChar} />}
    </div>
  );
};
