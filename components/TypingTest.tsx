import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from './Button';
import { HardcoreMode, TestResults, TimeLimit, GhostPacerMode } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';
import { VirtualKeyboard } from './VirtualKeyboard';
import { HandsGuide } from './HandsGuide';
import { playSound, playKeystrokeSound, getSoundProfile, setSoundProfile, SoundProfile, startMetronome, stopMetronome, warmupAudio } from '../services/soundService';
import { getUserStats } from '../services/storageService';
import { Theme, getStoredTheme, applyTheme } from '../services/themeService';
import { evaluateCourtTypingTest } from '../services/courtEvaluationService';

const TYPING_TEXT_SCALE_KEY = 'snaptype_typing_text_scale_v1';
const TYPING_FONT_KEY = 'snaptype_typing_font_v1';
export const AUTOPAUSE_ENABLED_KEY = 'snaptype_autopause_enabled_v1';
export const AUTOPAUSE_DELAY_KEY = 'snaptype_autopause_delay_v1';
export type PauseReason = 'manual' | 'auto_idle' | 'auto_blur' | null;
const WINDOW_PRE_CHARS = 900;
const WINDOW_POST_CHARS = 1800;
const ENTER_SYMBOL = '\u23CE';

export type TypingFont = 'inter' | 'roboto-mono' | 'jakarta' | 'courier' | 'jetbrains';

export const TYPING_FONTS: { id: TypingFont; label: string; className: string }[] = [
  { id: 'inter', label: 'Clean Sans (Inter)', className: 'font-sans-clean' },
  { id: 'roboto-mono', label: 'Roboto Mono', className: 'font-roboto-mono' },
  { id: 'jakarta', label: 'Jakarta Sans', className: 'font-jakarta' },
  { id: 'courier', label: 'Typewriter (Courier)', className: 'font-courier' },
  { id: 'jetbrains', label: 'JetBrains Mono', className: 'font-jetbrains' },
];

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
  isCourtExam?: boolean;
  lessonId?: string;
  initialHardcoreMode?: HardcoreMode;
  theme?: Theme;
  onToggleTheme?: () => void;
  onNextLesson?: () => void;
  nextLessonLabel?: string;
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
    let className = "relative transition-colors duration-75 inline-block align-top char-token ";
    
    if (status === 'pending') {
      className += "char-pending";
    } else if (status === 'correct') {
      className += "char-correct";
    } else if (status === 'incorrect') {
      className += "char-incorrect rounded-[2px]";
    }

    return (
        <span data-char-idx={index} className={className}>
            {isNewline ? (
              <span className={status === 'pending' ? "opacity-50 text-inherit" : "text-indigo-400 text-inherit"}>
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
    return <span className="inline-block whitespace-nowrap align-top">{renderedChars}</span>;
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
  isCourtExam = false,
  lessonId,
  initialHardcoreMode = 'NONE',
  theme,
  onToggleTheme,
  onNextLesson,
  nextLessonLabel,
}) => {
  const [input, setInput] = useState('');
  const [inputRevision, setInputRevision] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currIndex, setCurrIndex] = useState(0);
  const [hardKeys, setHardKeys] = useState<Record<string, number>>({});
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0, width: 2.5, height: 32 });
  const [caretTransitionEnabled, setCaretTransitionEnabled] = useState(true);
  const lastActiveLineTopRef = useRef<number | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(() => {
    try {
      return localStorage.getItem('snaptype_show_keyboard_v1') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('snaptype_show_keyboard_v1', String(showKeyboard));
    } catch {}
  }, [showKeyboard]);
  const [showHands, setShowHands] = useState(false);
  const [hardcoreMode, setHardcoreMode] = useState<HardcoreMode>(initialHardcoreMode);
  const [backspaceBlockedToast, setBackspaceBlockedToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [typingFont, setTypingFont] = useState<TypingFont>(() => {
    try {
      const raw = localStorage.getItem(TYPING_FONT_KEY);
      if (raw && TYPING_FONTS.some(f => f.id === raw)) {
        return raw as TypingFont;
      }
    } catch {}
    return 'inter';
  });

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => theme || getStoredTheme());

  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    if (onToggleTheme) onToggleTheme();
  };

  const activeFontClass = useMemo(() => {
    return TYPING_FONTS.find(f => f.id === typingFont)?.className || 'font-sans-clean';
  }, [typingFont]);

  useEffect(() => {
    try {
      localStorage.setItem(TYPING_FONT_KEY, typingFont);
    } catch {}
  }, [typingFont]);

  useEffect(() => {
    setHardcoreMode(initialHardcoreMode);
  }, [initialHardcoreMode, text]);
  const [soundProfile, setSoundProfileState] = useState<SoundProfile>(() => getSoundProfile());
  const [caretStyle, setCaretStyle] = useState<'line' | 'block' | 'underline'>('line');
  const [isZenMode, setIsZenMode] = useState(false);
  const [hasErrorShake, setHasErrorShake] = useState(false);
  const [pacerMode, setPacerMode] = useState<GhostPacerMode>('OFF');
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>(null);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTOPAUSE_ENABLED_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [autoPauseDelay, setAutoPauseDelay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(AUTOPAUSE_DELAY_KEY);
      const parsed = saved ? parseInt(saved, 10) : 5;
      return [3, 5, 10].includes(parsed) ? parsed : 5;
    } catch {
      return 5;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTOPAUSE_ENABLED_KEY, String(autoPauseEnabled));
    } catch {}
  }, [autoPauseEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTOPAUSE_DELAY_KEY, String(autoPauseDelay));
    } catch {}
  }, [autoPauseDelay]);

  // Segmented timer tracking to ensure pause duration never distorts WPM/accuracy
  const accumulatedTimeMsRef = useRef<number>(0);
  const activeSegmentStartTimeRef = useRef<number | null>(null);
  const autoPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef<boolean>(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, []);

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
    if (targetText.length <= 25000) {
      return { windowStart: 0, windowEnd: targetText.length };
    }
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
    accumulatedTimeMsRef.current = 0;
    activeSegmentStartTimeRef.current = null;
    setIsPaused(false);
    setPauseReason(null);
    lastActiveLineTopRef.current = null;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }
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
    if (isMetronomeOn && startTime && !hasCompletedRef.current && !isPaused) {
      const targetSpeed = ghostTargetWpm > 0 ? ghostTargetWpm : 35;
      startMetronome(targetSpeed);
    } else {
      stopMetronome();
    }
    return () => {
      stopMetronome();
    };
  }, [isMetronomeOn, startTime, ghostTargetWpm, isPaused]);

  // Segmented timer calculations
  const getPreciseElapsedSecs = useCallback((): number => {
    let totalMs = accumulatedTimeMsRef.current;
    if (activeSegmentStartTimeRef.current !== null && !isPausedRef.current) {
      totalMs += (Date.now() - activeSegmentStartTimeRef.current);
    }
    return totalMs / 1000;
  }, []);

  const pauseTest = useCallback((reason: PauseReason = 'manual') => {
    if (hasCompletedRef.current || !startTime || isPausedRef.current) return;
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
    stopMetronome();
  }, [startTime]);

  const resumeTest = useCallback(() => {
    if (hasCompletedRef.current || !isPausedRef.current) return;
    activeSegmentStartTimeRef.current = Date.now();
    isPausedRef.current = false;
    setIsPaused(false);
    setPauseReason(null);

    if (isMetronomeOn) {
      const targetSpeed = ghostTargetWpm > 0 ? ghostTargetWpm : 35;
      startMetronome(targetSpeed);
    }

    focusInput();
  }, [isMetronomeOn, ghostTargetWpm, focusInput]);

  const resetAutoPauseTimer = useCallback(() => {
    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }
    if (!autoPauseEnabled || !startTime || isPausedRef.current || hasCompletedRef.current) {
      return;
    }
    autoPauseTimeoutRef.current = setTimeout(() => {
      if (!isPausedRef.current && !hasCompletedRef.current) {
        pauseTest('auto_idle');
      }
    }, autoPauseDelay * 1000);
  }, [autoPauseEnabled, startTime, autoPauseDelay, pauseTest]);

  // Auto-pause on window blur or tab visibility change
  useEffect(() => {
    const handleBlur = () => {
      if (autoPauseEnabled && startTime && !isPausedRef.current && !hasCompletedRef.current) {
        pauseTest('auto_blur');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && autoPauseEnabled && startTime && !isPausedRef.current && !hasCompletedRef.current) {
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
  }, [autoPauseEnabled, startTime, pauseTest]);

  // Stats calculation
  const calculateStats = useCallback((useLevenshtein = false): TestResults => {
    let timeElapsedSecs = getPreciseElapsedSecs();
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

    const kdph = Math.round((input.length / Math.max(0.001, timeElapsedSecs / 3600)));

    return {
      netWpm,
      rawWpm,
      accuracy,
      realAccuracy,
      kdph,
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
     if (autoPauseTimeoutRef.current) {
       clearTimeout(autoPauseTimeoutRef.current);
       autoPauseTimeoutRef.current = null;
     }
     if (activeSegmentStartTimeRef.current !== null) {
       accumulatedTimeMsRef.current += (Date.now() - activeSegmentStartTimeRef.current);
       activeSegmentStartTimeRef.current = null;
     }
     const partialStats = calculateStats(false);
     
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
      lessonId: lessonId || undefined,
      hardcoreMode,
      kdph: partialStats.kdph,
    };

    if (isSSC || isCourtExam) {
        const courtEval = evaluateCourtTypingTest(
          targetText,
          input,
          partialStats.timeElapsed,
          partialStats.totalKeystrokes
        );

        finalResults.isCourtExam = true;
        finalResults.isSSC = true;
        finalResults.courtExam = courtEval;
        finalResults.rawWpm = courtEval.grossWpm;
        finalResults.netWpm = courtEval.netWpm;
        finalResults.accuracy = courtEval.accuracy;
        finalResults.incorrectChars = courtEval.totalMistakes;
    }

    onComplete(finalResults);
  }, [calculateStats, input, targetText, onComplete, isSSC, isCourtExam, lessonId, hardcoreMode, pacerMode, ghostTargetWpm]);

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
    if (startTime && !isPaused) {
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
          if (stats.timeElapsed >= timeLimit) {
            clearInterval(interval);
            if (finishTestRef.current) {
                finishTestRef.current();
            }
          }
        }
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [startTime, isPaused, timeLimit]);

  // Check for text completion
  useEffect(() => {
    if (timeLimit === 0 && input.length === targetText.length && input.length > 0) {
       finishTest();
    }
  }, [input, targetText, timeLimit, finishTest]);

  // Session shortcuts: Esc to pause/resume or restart, Ctrl/Cmd+Enter to submit, Tab to restart, and block Home/End/PageUp/PageDown
  const handleRestart = useCallback(() => {
    lastActiveLineTopRef.current = null;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    onRestart();
  }, [onRestart]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        if (inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
        return;
      }

      // If currently paused, Escape, Space, Enter, or any typing key resumes
      if (isPausedRef.current) {
        if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          resumeTest();
          return;
        }
        if (event.key === 'Tab') {
          event.preventDefault();
          handleRestart();
          return;
        }
        if (event.key.length === 1 || event.key === 'Backspace') {
          resumeTest();
          return;
        }
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        if (startTime && !hasCompletedRef.current) {
          pauseTest('manual');
        } else {
          handleRestart();
        }
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        handleRestart();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && startTime) {
        event.preventDefault();
        finishTestRef.current?.();
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRestart, startTime, resumeTest, pauseTest]);

  // Keep caret aligned to the active character and scroll discretely line-by-line when needed.
  const updateCaret = useCallback(() => {
    const container = containerRef.current;
    if (!container || chars.length === 0) return;

    const charIndexToMeasure = Math.min(currIndex, chars.length - 1);
    const cursorEl = container.querySelector(`[data-char-idx="${charIndexToMeasure}"]`) as HTMLSpanElement | null;
    if (!cursorEl) return;

    const textFlowEl = container.querySelector('.typing-text-flow') as HTMLDivElement | null;
    const flowOffsetTop = textFlowEl ? textFlowEl.offsetTop : 0;

    // Stable line coordinates: offsetTop is relative to the text flow container
    const lineTop = cursorEl.offsetTop + flowOffsetTop;
    const lineHeightPx = Math.round(textScale * 1.65);
    const caretHeight = Math.max(18, Math.round(textScale * 1.1));
    const caretTop = lineTop + Math.round((lineHeightPx - caretHeight) / 2);

    // Horizontal caret position
    const containerRect = container.getBoundingClientRect();
    const cursorRect = cursorEl.getBoundingClientRect();
    let newLeft = cursorRect.left - containerRect.left + container.scrollLeft;
    if (currIndex >= chars.length) {
      newLeft += cursorRect.width;
    }

    // Caret transition: smooth horizontal gliding within line, instant snap on line change
    const isLineChange = lastActiveLineTopRef.current === null || Math.abs(lineTop - lastActiveLineTopRef.current) > 8;
    if (isLineChange) {
      setCaretTransitionEnabled(false);
      lastActiveLineTopRef.current = lineTop;
      requestAnimationFrame(() => {
        setCaretTransitionEnabled(true);
      });
    }

    setCaretPos({
      top: caretTop,
      left: newLeft,
      width: cursorRect.width || 2.5,
      height: caretHeight,
    });

    // Discrete Line-Locked Viewport Scrolling
    // CRITICAL: NEVER scroll while typing across the same line!
    if (isLineChange) {
      const lineBottomInView = lineTop + lineHeightPx - container.scrollTop;
      const lineTopInView = lineTop - container.scrollTop;
      const targetReadingBand = Math.round(container.clientHeight * 0.32);

      // Trigger scroll only when active line moves past lower comfort boundary
      const lowerBoundary = container.clientHeight - Math.max(70, Math.round(lineHeightPx * 1.4));
      if (lineBottomInView > lowerBoundary) {
        const targetScrollTop = Math.max(0, lineTop - targetReadingBand);
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      } else if (lineTopInView < 32 && container.scrollTop > 0) {
        // Backspaced above the viewport top
        const targetScrollTop = Math.max(0, lineTop - 32);
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    }
  }, [currIndex, chars.length, textScale]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updateCaret);
    return () => cancelAnimationFrame(rafId);
  }, [updateCaret]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      updateCaret();
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateCaret]);

  useEffect(() => {
    lastActiveLineTopRef.current = null;
    requestAnimationFrame(updateCaret);
  }, [textScale, updateCaret]);

  // Auto-focus input & warm up audio immediately on mount, lock body overflow
  useEffect(() => {
    warmupAudio();
    inputRef.current?.focus();
    requestAnimationFrame(updateCaret);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [updateCaret]);

  const syncCaretToEnd = useCallback(() => {
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (hasCompletedRef.current) return;
    const rawVal = e.target.value.slice(0, targetText.length);
    const prevInput = input;
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

    // Defensive check: if cursor was somehow displaced (e.g. Home key pressed or mouse clicked)
    // and a character was inserted at index 0 or mid-text, never shift existing text!
    // Instead, extract the newly typed character and append it cleanly to prevInput.
    let val = rawVal;
    if (rawVal.length > prevInput.length && !rawVal.startsWith(prevInput)) {
      let newChar = '';
      if (rawVal.endsWith(prevInput)) {
        // Character was inserted at index 0 (e.g. user pressed Home key right before typing)
        newChar = rawVal.slice(0, rawVal.length - prevInput.length);
      } else {
        // Character was inserted mid-text: extract the first differing character
        for (let i = 0; i < rawVal.length; i++) {
          if (i >= prevInput.length || rawVal[i] !== prevInput[i]) {
            newChar = rawVal[i];
            break;
          }
        }
      }
      val = (prevInput + newChar).slice(0, targetText.length);
      if (inputRef.current) {
        inputRef.current.value = val;
        inputRef.current.setSelectionRange(val.length, val.length);
      }
    }

    // Enforce NO_BACKSPACE mode
    if (hardcoreMode === 'NO_BACKSPACE' && val.length < prevInput.length) {
      if (inputRef.current) {
        inputRef.current.value = prevInput;
        inputRef.current.setSelectionRange(prevInput.length, prevInput.length);
      }
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
      const newCharIndex = prevInput.length;
      const typedChar = val[val.length - 1];
      if (newCharIndex < targetText.length && typedChar !== targetText[newCharIndex]) {
        if (inputRef.current) {
          inputRef.current.value = prevInput;
          inputRef.current.setSelectionRange(prevInput.length, prevInput.length);
        }
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
      const newCharIndex = prevInput.length;
      const typedChar = val[val.length - 1];
      if (newCharIndex < targetText.length && typedChar !== targetText[newCharIndex]) {
        if (soundProfile !== 'off') playSound('error');
        setHasErrorShake(true);
        setInput(val);
        setCurrIndex(val.length);
        hasCompletedRef.current = true;
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
      totalKeystrokesRef.current += removedChars;
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
                const expectedKey = expectedChar === '\n' ? 'Enter' : expectedChar === ' ' ? 'Space' : expectedChar.toLowerCase();
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
    resetAutoPauseTimer();
  };
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
      displayTime = Math.max(0, Math.ceil(timeLimit - stats.timeElapsed));
      if (!startTime) displayTime = timeLimit;
  }

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
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">{formatTime(displayTime)}</span>
              {isPaused && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase animate-pulse">
                  Paused
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {startTime && (
              <button
                onClick={(e) => { e.stopPropagation(); if (isPaused) resumeTest(); else pauseTest('manual'); }}
                className={`text-xs font-mono px-3 py-1 rounded-xl border transition-colors flex items-center gap-1.5 ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
                title={isPaused ? 'Resume Test (Esc / Space)' : 'Pause Test (Esc)'}
              >
                <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setIsZenMode(false); }}
              className="text-xs font-mono px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            >
              Exit Zen Mode
            </button>
          </div>
        </div>
      ) : (
      <>
      {/* ── Slim Minimalist Stats Bar (Ultra Clean, Zero Clutter) ── */}
      <div className="w-full shrink-0 z-40 flex items-center justify-between gap-3 px-3 md:px-5 py-2 mb-2 rounded-xl bg-neutral-950/70 border border-white/8 backdrop-blur-md shadow-sm">
        {/* Core Metrics */}
        <div className="flex items-center gap-4 md:gap-6 font-mono text-sm">
          {/* Net WPM */}
          <div className="flex items-baseline gap-1" title="Net Words Per Minute">
            <span className="text-2xl font-black text-indigo-400 tabular-nums leading-none tracking-tight">{stats.netWpm}</span>
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">wpm</span>
          </div>

          <div className="w-px h-5 bg-white/10 hidden sm:block" />

          {/* Accuracy */}
          <div className="flex items-baseline gap-1.5" title={`Accuracy${stats.realAccuracy !== undefined && stats.realAccuracy !== stats.accuracy ? ` (${stats.realAccuracy}% real)` : ''}`}>
            <span className={`text-xl font-black tabular-nums leading-none ${
              stats.accuracy >= 97 ? 'text-emerald-400' : stats.accuracy >= 90 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {stats.accuracy}%
            </span>
            {stats.realAccuracy !== undefined && stats.realAccuracy !== stats.accuracy && (
              <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline" title="Real Keystroke Accuracy (accounting for corrected errors)">
                ({stats.realAccuracy}% real)
              </span>
            )}
          </div>

          {/* Errors count if any */}
          {stats.incorrectChars > 0 && (
            <>
              <div className="w-px h-5 bg-white/10 hidden sm:block" />
              <div className="flex items-baseline gap-1" title="Current Errors">
                <span className="text-lg font-bold text-rose-400 tabular-nums leading-none">{stats.incorrectChars}</span>
                <span className="text-[10px] text-rose-400/70 uppercase font-semibold">err</span>
              </div>
            </>
          )}

          <div className="w-px h-5 bg-white/10 hidden sm:block" />

          {/* Timer */}
          <div className="flex items-center gap-1.5" title={timeLimit > 0 ? 'Remaining Time' : 'Elapsed Time'}>
            <span className={`text-lg font-bold tabular-nums leading-none font-mono ${
              timeLimit > 0 && displayTime < 10 ? 'text-rose-500 animate-pulse font-black' : 'text-neutral-300'
            }`}>
              {formatTime(displayTime)}
            </span>
            {isPaused && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                Paused
              </span>
            )}
          </div>

          {/* Active Mode Pill if not standard */}
          {hardcoreMode === 'RIGHT_HAND_FOCUS' && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              ✋ Right-Hand
            </span>
          )}
          {hardcoreMode === 'NO_BACKSPACE' && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300">
              🛡️ No ⌫
            </span>
          )}
        </div>

        {/* Center Progress Line */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4 items-center gap-2">
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-neutral-400 tabular-nums w-8 text-right font-medium">{progressPercent}%</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pause / Resume Button */}
          {startTime && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPaused) {
                  resumeTest();
                } else {
                  pauseTest('manual');
                }
              }}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isPaused
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                  : 'text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8'
              }`}
              title={isPaused ? 'Resume Test (Esc / Space)' : 'Pause Test (Esc)'}
            >
              <span className="text-xs">{isPaused ? '▶' : '⏸'}</span>
              <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          {/* Settings Toggle Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings(p => !p); }}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showSettings 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm' 
                : 'text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8'
            }`}
            title="Typing Preferences & Modes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Next Lesson Advancement */}
          {onNextLesson && nextLessonLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onNextLesson(); }}
              className="h-8 px-3 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/35 transition-all flex items-center gap-1 shadow-sm"
              title={`Advance to ${nextLessonLabel}`}
            >
              <span>Next</span>
              <span>⏭️</span>
            </button>
          )}

          {/* Submit Test Button */}
          <button
            onClick={(e) => { e.stopPropagation(); finishTestRef.current?.(); }}
            disabled={!startTime && input.length === 0}
            className="h-8 px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <span>Done</span>
            <kbd className="hidden md:inline-block text-[9px] font-mono font-normal bg-black/10 px-1 py-0.5 rounded text-neutral-700">Ctrl+↵</kbd>
          </button>

          {/* Back / Exit Test Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleRestart(); }} 
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            title="Back to Menu / Exit Test (Esc)"
          >
            <span className="text-sm font-bold leading-none">←</span>
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* ── Settings Dropdown Panel (Organized Clean Grid) ── */}
      {showSettings && (
        <div 
          className="w-full shrink-0 z-30 mb-2 px-1 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-neutral-900/95 backdrop-blur-2xl border border-white/12 rounded-2xl p-4 md:p-5 shadow-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {/* Column 1: Typography & Size */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <span>🔤</span> Font & Size
              </span>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setTextScale(p => Math.max(20, p - 2)); }}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 font-bold transition-colors"
                  title="Smaller font"
                >
                  −
                </button>
                <span className="text-[11px] font-mono text-neutral-300 flex-1 text-center font-bold">{textScale}px</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setTextScale(p => Math.min(46, p + 2)); }}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 font-bold transition-colors"
                  title="Larger font"
                >
                  +
                </button>
              </div>
              <select
                value={typingFont}
                onChange={(e) => { e.stopPropagation(); setTypingFont(e.target.value as TypingFont); }}
                className="text-[11px] font-medium px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:text-white cursor-pointer transition-colors"
              >
                {TYPING_FONTS.map(f => <option key={f.id} value={f.id} className="bg-neutral-900">{f.label}</option>)}
              </select>
              <button
                onClick={(e) => { e.stopPropagation(); setCaretStyle(p => p === 'line' ? 'block' : p === 'block' ? 'underline' : 'line'); }}
                className="text-[11px] font-mono px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:text-white text-left transition-colors"
              >
                Caret: {caretStyle.toUpperCase()}
              </button>
            </div>

            {/* Column 2: Sound & Rhythm */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <span>🔊</span> Audio & Pace
              </span>
              <select
                value={soundProfile}
                onChange={(e) => {
                  e.stopPropagation();
                  const next = e.target.value as SoundProfile;
                  setSoundProfileState(next);
                  setSoundProfile(next);
                  playKeystrokeSound(next);
                }}
                className="text-[11px] font-medium px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:text-white cursor-pointer transition-colors"
              >
                <option value="cherry-blue" className="bg-neutral-900">Cherry Blue (Clicky)</option>
                <option value="cherry-brown" className="bg-neutral-900">Cherry Brown (Tactile)</option>
                <option value="topre" className="bg-neutral-900">Topre (Thock)</option>
                <option value="typewriter" className="bg-neutral-900">Typewriter</option>
                <option value="soft" className="bg-neutral-900">Soft Bubble</option>
                <option value="off" className="bg-neutral-900">Sound Muted</option>
              </select>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMetronomeOn(p => !p); }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left font-semibold transition-all flex items-center justify-between ${
                  isMetronomeOn
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span>🎵 Metronome</span>
                <span className="font-mono text-[10px] uppercase font-bold">{isMetronomeOn ? 'ON' : 'OFF'}</span>
              </button>
              <select
                value={pacerMode}
                onChange={(e) => { e.stopPropagation(); setPacerMode(e.target.value as GhostPacerMode); }}
                className={`text-[11px] font-medium px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  pacerMode === 'OFF'
                    ? 'bg-white/5 border-white/10 text-neutral-400'
                    : 'bg-purple-500/20 border-purple-500/40 text-purple-300 font-bold'
                }`}
              >
                <option value="OFF" className="bg-neutral-900">Ghost Pacer: OFF</option>
                <option value="30_WPM" className="bg-neutral-900">Ghost: 30 WPM (SSC)</option>
                <option value="35_WPM" className="bg-neutral-900">Ghost: 35 WPM (Clerk)</option>
                <option value="40_WPM" className="bg-neutral-900">Ghost: 40 WPM (Goal)</option>
                <option value="50_WPM" className="bg-neutral-900">Ghost: 50 WPM (Pro)</option>
                <option value="PERSONAL_BEST" className="bg-neutral-900">Ghost: Personal Best</option>
              </select>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[11px] font-medium text-neutral-300 flex items-center gap-1">
                  <span>⏸️</span> Auto-Pause
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setAutoPauseEnabled(p => !p); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                    autoPauseEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-neutral-400 border border-white/10'
                  }`}
                >
                  {autoPauseEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {autoPauseEnabled && (
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-neutral-400 px-0.5">
                  <span>Idle delay:</span>
                  <div className="flex gap-1">
                    {[3, 5, 10].map(delay => (
                      <button
                        key={delay}
                        onClick={(e) => { e.stopPropagation(); setAutoPauseDelay(delay); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          autoPauseDelay === delay
                            ? 'bg-indigo-500 text-white font-bold'
                            : 'bg-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {delay}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Specialized Training Modes */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <span>🎯</span> Training Mode
              </span>
              <select
                value={hardcoreMode}
                onChange={(e) => { e.stopPropagation(); setHardcoreMode(e.target.value as HardcoreMode); }}
                className={`text-[11px] font-medium px-2 py-1.5 rounded-lg border cursor-pointer transition-all ${
                  hardcoreMode === 'NONE'
                    ? 'bg-white/5 border-white/10 text-neutral-300'
                    : hardcoreMode === 'RIGHT_HAND_FOCUS'
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                    : hardcoreMode === 'NO_BACKSPACE'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold'
                }`}
              >
                <option value="NONE" className="bg-neutral-900">Standard Practice</option>
                <option value="RIGHT_HAND_FOCUS" className="bg-neutral-900">✋ Right Hand Focus</option>
                <option value="NO_BACKSPACE" className="bg-neutral-900">🛡️ No Backspace (Real Acc)</option>
                <option value="STOP_ON_ERROR" className="bg-neutral-900">🛑 Stop on Error</option>
                <option value="SUDDEN_DEATH" className="bg-neutral-900">💀 Sudden Death</option>
              </select>
              <div className="text-[10px] text-neutral-400 leading-tight p-2 rounded-lg bg-white/3 border border-white/5">
                {hardcoreMode === 'RIGHT_HAND_FOCUS' && '✋ Emphasizes right index, middle, ring, pinky & punctuation keys.'}
                {hardcoreMode === 'NO_BACKSPACE' && '🛡️ Backspace blocked to enforce true muscle memory.'}
                {hardcoreMode === 'STOP_ON_ERROR' && '🛑 Cursor pauses until the correct key is typed.'}
                {hardcoreMode === 'SUDDEN_DEATH' && '💀 One wrong key immediately ends the test.'}
                {hardcoreMode === 'NONE' && 'Standard free-flow typing with normal backspacing.'}
              </div>
            </div>

            {/* Column 4: Guides & View */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <span>👁️</span> Visual Guides
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowKeyboard(p => !p); }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left font-semibold transition-all flex items-center justify-between ${
                  showKeyboard
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span>⌨️ Keyboard</span>
                <span className="font-mono text-[10px]">{showKeyboard ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowHands(p => !p); }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left font-semibold transition-all flex items-center justify-between ${
                  showHands
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <span>✋ Hands Placement</span>
                <span className="font-mono text-[10px]">{showHands ? 'ON' : 'OFF'}</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsZenMode(p => !p); }}
                  className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-center transition-colors"
                >
                  👁 Zen Mode
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                  className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-center transition-colors"
                  title="Toggle Light / Dark Mode"
                >
                  {currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
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

      {/* Right Hand Special Training Mode Banner */}
      {hardcoreMode === 'RIGHT_HAND_FOCUS' && (
        <div className="w-full shrink-0 flex items-center justify-between px-4 py-2 mb-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">✋</span>
            <span className="font-bold">Right Hand Focus Mode:</span>
            <span className="text-neutral-300 hidden sm:inline">Focus on right index, middle, ring, pinky & punctuation keys (H, J, K, L, ;, Y, U, I, O, P, N, M, ,, ., /)</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest hidden md:inline">
            Right Hand Active
          </span>
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
      <div className={`w-full flex-1 min-h-0 flex flex-col bento-card bg-neutral-950/60 backdrop-blur-2xl rounded-3xl border border-white/10 hover:border-white/15 transition-all duration-150 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden relative ${
        hasErrorShake ? 'animate-shake border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.3)]' : ''
      }`}>
        {/* Sleek Progress Line fixed at the very top edge of the card */}
        <div className="w-full h-1 bg-white/5 shrink-0 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 transition-all duration-150 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

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
                    : 'Test Paused'}
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Frozen
                </span>
              </div>
              <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-md">
                {pauseReason === 'auto_idle'
                  ? `Detected ${autoPauseDelay} seconds of inactivity. Timer and WPM are paused.`
                  : pauseReason === 'auto_blur'
                  ? 'Window or tab lost focus. Your typing stats are safely preserved.'
                  : 'Timer and speed metrics are frozen. Take a breath and resume when ready.'}
              </p>
            </div>

            {/* Snapshot Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mb-6">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Speed</span>
                <span className="text-2xl font-black text-indigo-400 font-mono mt-0.5">{stats.netWpm}</span>
                <span className="text-[10px] text-neutral-500">Net WPM</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Accuracy</span>
                <span className={`text-2xl font-black font-mono mt-0.5 ${stats.accuracy >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stats.accuracy}%
                </span>
                <span className="text-[10px] text-neutral-500">{stats.realAccuracy !== undefined ? `${stats.realAccuracy}% real` : 'accuracy'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
                  {timeLimit > 0 ? 'Remaining' : 'Elapsed'}
                </span>
                <span className="text-2xl font-black text-neutral-200 font-mono mt-0.5">{formatTime(displayTime)}</span>
                <span className="text-[10px] text-neutral-500">Timer</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 pause-card text-center flex flex-col">
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Progress</span>
                <span className="text-2xl font-black text-cyan-400 font-mono mt-0.5">{progressPercent}%</span>
                <span className="text-[10px] text-neutral-500">{input.length}/{targetText.length} chars</span>
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
                onClick={(e) => { e.stopPropagation(); handleRestart(); }}
                className="py-3 px-5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                title="Restart Session (Tab)"
              >
                <span>↺ Restart</span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 font-normal">
                  Tab
                </kbd>
              </button>
              {input.length >= 10 && (
                <button
                  onClick={(e) => { e.stopPropagation(); finishTestRef.current?.(); }}
                  className="py-3 px-4 rounded-2xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/8 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Submit current test results now"
                >
                  <span>Submit Early</span>
                </button>
              )}
            </div>

            {/* Quick Resume Helper Footnote */}
            <div className="mt-4 text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tip: Simply start typing any character to resume</span>
            </div>
          </div>
        )}

        {/* Scrollable Text Viewport */}
        <div 
          ref={containerRef}
          onClick={focusInput}
          className="w-full flex-1 min-h-0 relative p-6 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 typing-scroll-viewport"
          style={{ scrollbarGutter: 'stable' }}
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
                transition: caretTransitionEnabled ? 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)' : 'none', 
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
                transition: caretTransitionEnabled ? 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)' : 'none', 
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
                transition: caretTransitionEnabled ? 'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1)' : 'none', 
              }}
            />
          )}

          {/* Text Rendering Flow */}
          <div
            className={`whitespace-pre-wrap break-normal min-h-full pb-20 relative z-10 ${activeFontClass} typing-text-flow select-none [word-break:normal] [overflow-wrap:normal]`}
            style={{ fontSize: `${textScale}px`, lineHeight }}
          >
            {prefixText && <span className="char-correct opacity-60">{prefixText}</span>}
            {windowedTokens.map(token => (
              <TokenItem
                key={token.tokenKey}
                token={token}
                input={input}
                inputLength={input.length}
                inputRevision={inputRevision}
              />
            ))}
            {suffixText && <span className="char-pending">{suffixText}</span>}
          </div>
          
          {/* Hidden Textarea (supports native focus and keyboard events, strictly pinned to append-only and fixed at viewport top) */}
          <textarea
            ref={inputRef}
            className="opacity-0 fixed top-0 left-0 w-1 h-1 pointer-events-none -z-50 resize-none select-none"
            value={input}
            onChange={handleInputChange}
            onBlur={focusInput}
            onSelect={(e) => {
              const len = e.currentTarget.value.length;
              if (e.currentTarget.selectionStart !== len || e.currentTarget.selectionEnd !== len) {
                e.currentTarget.setSelectionRange(len, len);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              focusInput();
              syncCaretToEnd();
            }}
            onMouseDown={() => {
              focusInput();
            }}
            onPaste={(e) => {
              e.preventDefault();
            }}
            onKeyDown={(e) => {
              // Block all cursor displacement keys
              if (['Home', 'End', 'PageUp', 'PageDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                syncCaretToEnd();
                return;
              }

              if (e.key === 'Tab') {
                e.preventDefault();
                handleRestart();
                return;
              }

              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && startTime) {
                e.preventDefault();
                finishTestRef.current?.();
                return;
              }
            }}
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
          <HandsGuide nextChar={nextChar} focusHand={hardcoreMode === 'RIGHT_HAND_FOCUS' ? 'right' : undefined} />
        </div>
      )}

      {!isZenMode && showVirtualKeyboard && <VirtualKeyboard nextChar={nextChar} />}
    </div>
  );
};
