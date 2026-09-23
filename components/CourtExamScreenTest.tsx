import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TestResults, TimeLimit, Theme } from '../types';
import { evaluateCourtTypingTest } from '../services/courtEvaluationService';
import { AUTOPAUSE_ENABLED_KEY, AUTOPAUSE_DELAY_KEY, PauseReason } from './TypingTest';

interface CourtExamScreenTestProps {
  passageText: string;
  timeLimit: TimeLimit;
  onComplete: (results: TestResults) => void;
  onRestart: () => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export type CourtFontFamily = 'times' | 'arial' | 'courier';
export type CourtFontSize = '11pt' | '12pt' | '14pt';

const FONT_FAMILY_MAP: Record<CourtFontFamily, { name: string; style: string; label: string }> = {
  times: {
    name: 'Times New Roman',
    style: '"Times New Roman", Times, Georgia, serif',
    label: 'Times New Roman (Official Legal Standard)',
  },
  arial: {
    name: 'Arial',
    style: 'Arial, Helvetica, sans-serif',
    label: 'Arial (TCS iON Standard)',
  },
  courier: {
    name: 'Courier New',
    style: '"Courier New", Courier, monospace',
    label: 'Courier New (Traditional Court Monospace)',
  },
};

const FONT_SIZE_MAP: Record<CourtFontSize, { px: number; label: string }> = {
  '11pt': { px: 14.5, label: '11 pt (Compact)' },
  '12pt': { px: 16.0, label: '12 pt (Official Exam Standard)' },
  '14pt': { px: 18.5, label: '14 pt (Large)' },
};

export const CourtExamScreenTest: React.FC<CourtExamScreenTestProps> = ({
  passageText,
  timeLimit = 600,
  onComplete,
  onRestart,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [pasteBlockedToast, setPasteBlockedToast] = useState(false);

  // Font selections (persisted in localStorage)
  const [fontFamily, setFontFamily] = useState<CourtFontFamily>(() => {
    try {
      const saved = localStorage.getItem('snaptype_court_font_family');
      return saved === 'arial' || saved === 'courier' ? saved : 'times';
    } catch {
      return 'times';
    }
  });

  const [fontSize, setFontSize] = useState<CourtFontSize>(() => {
    try {
      const saved = localStorage.getItem('snaptype_court_font_size');
      return saved === '11pt' || saved === '14pt' ? saved : '12pt';
    } catch {
      return '12pt';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('snaptype_court_font_family', fontFamily);
    } catch {}
  }, [fontFamily]);

  useEffect(() => {
    try {
      localStorage.setItem('snaptype_court_font_size', fontSize);
    } catch {}
  }, [fontSize]);

  // Auto-pause settings
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const passageBoxRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const totalKeystrokesRef = useRef(0);
  const backspaceCountRef = useRef(0);
  const finishTestRef = useRef<() => void>(() => {});
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focusInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const getPreciseElapsedSecs = useCallback((): number => {
    let totalMs = accumulatedTimeMsRef.current;
    if (activeSegmentStartTimeRef.current !== null && !isPausedRef.current) {
      totalMs += Date.now() - activeSegmentStartTimeRef.current;
    }
    return totalMs / 1000;
  }, []);

  const pauseTest = useCallback(
    (reason: PauseReason = 'manual') => {
      if (hasCompletedRef.current || !startTime || isPausedRef.current) return;
      if (activeSegmentStartTimeRef.current !== null) {
        accumulatedTimeMsRef.current += Date.now() - activeSegmentStartTimeRef.current;
        activeSegmentStartTimeRef.current = null;
      }
      if (autoPauseTimeoutRef.current) {
        clearTimeout(autoPauseTimeoutRef.current);
        autoPauseTimeoutRef.current = null;
      }
      isPausedRef.current = true;
      setIsPaused(true);
      setPauseReason(reason);
    },
    [startTime]
  );

  const resumeTest = useCallback(() => {
    if (hasCompletedRef.current || !isPausedRef.current) return;
    activeSegmentStartTimeRef.current = Date.now();
    isPausedRef.current = false;
    setIsPaused(false);
    setPauseReason(null);
    focusInput();
  }, [focusInput]);

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

  // Tab blur / visibility auto-pause
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
    };
  }, [autoPauseEnabled, startTime, pauseTest]);

  // Finish and evaluate the exam
  const finishTest = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    if (autoPauseTimeoutRef.current) {
      clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }
    if (activeSegmentStartTimeRef.current !== null) {
      accumulatedTimeMsRef.current += Date.now() - activeSegmentStartTimeRef.current;
      activeSegmentStartTimeRef.current = null;
    }

    const elapsedSeconds = getPreciseElapsedSecs();
    const effectiveElapsed = timeLimit > 0 ? Math.min(timeLimit, elapsedSeconds) : elapsedSeconds;

    const courtEval = evaluateCourtTypingTest(
      passageText,
      input,
      effectiveElapsed,
      totalKeystrokesRef.current
    );

    const finalResults: TestResults = {
      netWpm: courtEval.netWpm,
      rawWpm: courtEval.grossWpm,
      accuracy: courtEval.accuracy,
      realAccuracy: courtEval.accuracy,
      kdph: Math.round((courtEval.totalKeyDepressions / Math.max(0.001, effectiveElapsed / 3600))),
      totalKeystrokes: courtEval.totalKeyDepressions,
      totalRawErrors: courtEval.totalMistakes,
      backspaceCount: backspaceCountRef.current,
      correctedErrors: 0,
      timeElapsed: effectiveElapsed,
      totalChars: input.length,
      correctChars: Math.max(0, input.length - courtEval.totalMistakes * 5),
      incorrectChars: courtEval.totalMistakes,
      hardKeys: {},
      missedWords: {},
      history: [],
      originalText: passageText,
      typedText: input,
      isCourtExam: true,
      isSSC: true,
      courtExam: courtEval,
    };

    onComplete(finalResults);
  }, [passageText, input, getPreciseElapsedSecs, timeLimit, onComplete]);

  finishTestRef.current = finishTest;

  // Real-time 1s interval loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (startTime && !hasCompletedRef.current && !isPaused) {
      interval = setInterval(() => {
        const secs = getPreciseElapsedSecs();
        setElapsed(secs);

        if (timeLimit > 0 && secs >= timeLimit) {
          finishTestRef.current?.();
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [startTime, isPaused, timeLimit, getPreciseElapsedSecs]);

  // Global hotkeys (Esc = Pause, Tab = Restart, Ctrl+Enter = Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (startTime && !hasCompletedRef.current) {
          if (isPaused) resumeTest();
          else pauseTest('manual');
        } else {
          onRestart();
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        onRestart();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (input.trim().length > 0) {
          setShowSubmitModal(true);
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startTime, isPaused, resumeTest, pauseTest, onRestart, input]);

  // Initial autofocus
  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (hasCompletedRef.current) return;
    const val = e.target.value;
    const prevLen = input.length;

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

    if (val.length > prevLen) {
      totalKeystrokesRef.current += val.length - prevLen;
    } else if (val.length < prevLen) {
      backspaceCountRef.current += prevLen - val.length;
    }

    setInput(val);
  };

  const handlePasteAttempt = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setPasteBlockedToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setPasteBlockedToast(false), 2000);
  };

  // Word & character stats
  const passageWords = useMemo(() => {
    return (passageText.trim().match(/\S+/g) || []).length;
  }, [passageText]);

  const typedWords = useMemo(() => {
    return (input.trim().match(/\S+/g) || []).length;
  }, [input]);

  const remainingSeconds = timeLimit > 0 ? Math.max(0, Math.ceil(timeLimit - elapsed)) : 0;
  const isTimeUrgent = timeLimit > 0 && remainingSeconds <= 60 && startTime !== null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeFontFamilyCss = FONT_FAMILY_MAP[fontFamily].style;
  const activeFontSizePx = FONT_SIZE_MAP[fontSize].px;

  return (
    <div className="w-full flex-1 flex flex-col h-full gap-2 max-w-6xl mx-auto select-none pt-1">
      {/* ── Top Official Exam Header HUD ── */}
      <div className="w-full shrink-0 bento-card bg-white dark:bg-[#121721] border border-slate-300 dark:border-white/10 p-2.5 md:p-3 rounded-2xl flex flex-wrap items-center justify-between shadow-sm dark:shadow-2xl gap-3 text-slate-800 dark:text-neutral-200">
        {/* Left: Court Badge & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shadow-xs shrink-0">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs md:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Punjab & Haryana High Court (SSSC)</span>
              </h2>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 px-2 py-0.5 rounded-md">
                Dual-Box CPT
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-neutral-400 font-mono mt-0.5 flex-wrap">
              <span>Cutoff: ≥ 30 WPM</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Max Error: ≤ 5.00%</span>
              <span>•</span>
              <span>10 Min Exam</span>
            </div>
          </div>
        </div>

        {/* Center: Live Countdown Timer & Strokes */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-xl border font-mono transition-all ${
              isTimeUrgent
                ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : isPaused
                ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-sm'
                : 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-white/5 dark:text-neutral-100 dark:border-white/10'
            }`}
          >
            <span className="text-sm">⏱️</span>
            <span className="text-lg md:text-xl font-black tracking-tight">
              {timeLimit > 0 ? formatTime(remainingSeconds) : formatTime(Math.floor(elapsed))}
            </span>
          </div>

          <div className="hidden sm:flex flex-col text-right font-mono text-[11px] text-slate-600 dark:text-neutral-400">
            <div>
              Strokes: <span className="text-slate-900 dark:text-white font-bold">{totalKeystrokesRef.current}</span>
            </div>
            <div>
              Words: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{typedWords}</span> / {passageWords}
            </div>
          </div>
        </div>

        {/* Right: Exam Controls & Font Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Font Family Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-0.5 text-xs font-mono">
            <button
              onClick={() => setFontFamily('times')}
              className={`px-2 py-1 rounded-lg transition-all ${
                fontFamily === 'times'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs keep-white'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Times New Roman (Official Legal Standard)"
            >
              Times
            </button>
            <button
              onClick={() => setFontFamily('arial')}
              className={`px-2 py-1 rounded-lg transition-all ${
                fontFamily === 'arial'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs keep-white'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Arial (TCS iON Standard)"
            >
              Arial
            </button>
            <button
              onClick={() => setFontFamily('courier')}
              className={`px-2 py-1 rounded-lg transition-all ${
                fontFamily === 'courier'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs keep-white'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Courier New (Traditional Monospace)"
            >
              Courier
            </button>
          </div>

          {/* Font Size Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-0.5 text-xs font-mono">
            <button
              onClick={() => setFontSize('11pt')}
              className={`px-1.5 py-1 rounded-lg transition-all ${
                fontSize === '11pt'
                  ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="11 pt (Compact)"
            >
              11pt
            </button>
            <button
              onClick={() => setFontSize('12pt')}
              className={`px-1.5 py-1 rounded-lg transition-all ${
                fontSize === '12pt'
                  ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="12 pt (Official Exam Standard)"
            >
              12pt
            </button>
            <button
              onClick={() => setFontSize('14pt')}
              className={`px-1.5 py-1 rounded-lg transition-all ${
                fontSize === '14pt'
                  ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="14 pt (Large)"
            >
              14pt
            </button>
          </div>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-white/10 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}

          {/* Pause Button */}
          {startTime && (
            <button
              onClick={() => {
                if (isPaused) resumeTest();
                else pauseTest('manual');
              }}
              className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-white/10 text-xs font-semibold transition-all flex items-center gap-1"
              title="Pause (Esc)"
            >
              <span>{isPaused ? '▶' : '⏸'}</span>
            </button>
          )}

          {/* Back to Menu / Exit Exam Button */}
          <button
            onClick={onRestart}
            className="h-8 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-white dark:border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Back to Dashboard / Exit Exam"
          >
            <span className="text-sm font-bold leading-none">←</span>
            <span>Back</span>
          </button>

          {/* Submit Test Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 keep-white"
            title="Submit Exam (Ctrl+Enter)"
          >
            <span>Submit</span>
            <kbd className="hidden md:inline-block text-[9px] font-mono bg-emerald-700/80 px-1 py-0.5 rounded text-white font-normal keep-white">
              Ctrl+↵
            </kbd>
          </button>
        </div>
      </div>

      {/* ── Main Dual-Box Workplace (Stacked Top & Bottom) ── */}
      <div className="w-full flex-1 flex flex-col gap-2.5 min-h-0 relative">
        {/* Paste Blocked Alert Toast */}
        {pasteBlockedToast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-rose-600 text-white font-mono text-xs shadow-2xl flex items-center gap-2 border border-rose-400 animate-bounce keep-white">
            <span>🚫</span>
            <span>Copy / Paste is strictly disabled in Court Exam Mode!</span>
          </div>
        )}

        {/* ── BOX 1: Master Question Passage Box (Read-Only) ── */}
        <div className="flex-1 min-h-[35%] flex flex-col bento-card bg-white dark:bg-[#121721] border border-slate-300 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg">
          {/* Box Header */}
          <div className="w-full shrink-0 px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-800 dark:text-neutral-200">
              <span className="text-amber-600 dark:text-amber-400">📖</span>
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Question Passage (Read-Only)
              </span>
              <span className="text-slate-400 dark:text-neutral-500 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-neutral-400 hidden sm:inline">{FONT_FAMILY_MAP[fontFamily].name} {fontSize}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400 text-[11px]">
              <span>Passage Length:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{passageWords} words</span>
            </div>
          </div>

          {/* Scrollable Passage Body */}
          <div
            ref={passageBoxRef}
            className="flex-1 p-5 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 select-none bg-white dark:bg-transparent"
            style={{
              fontFamily: activeFontFamilyCss,
              fontSize: `${activeFontSizePx}px`,
              lineHeight: 1.65,
              letterSpacing: '0.01em',
            }}
            onCopy={handlePasteAttempt}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="court-exam-passage-text whitespace-pre-wrap break-normal leading-relaxed text-slate-950 dark:text-slate-100 font-normal">
              {passageText}
            </div>
          </div>
        </div>

        {/* ── BOX 2: Candidate Typing Area (Starts Blank) ── */}
        <div className="flex-1 min-h-[42%] flex flex-col bento-card bg-white dark:bg-[#0c1017] border border-indigo-400 dark:border-indigo-500/40 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-all">
          {/* Box Header */}
          <div className="w-full shrink-0 px-4 py-2 bg-indigo-50/90 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <span className="text-indigo-600 dark:text-indigo-400">⌨️</span>
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Candidate Response Console
              </span>
              <span className="text-indigo-300 dark:text-neutral-500 hidden sm:inline">•</span>
              <span className="text-indigo-700 dark:text-neutral-400 text-[11px] hidden sm:inline">
                Type text from the upper box here
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-neutral-400 text-[11px]">
              <span>Typed: <strong className="text-slate-950 dark:text-white">{typedWords}</strong> words</span>
              <span>•</span>
              <span>Strokes: <strong className="text-cyan-700 dark:text-cyan-400">{input.length}</strong></span>
            </div>
          </div>

          {/* Active Typing Textarea */}
          <div className="flex-1 relative p-4 md:p-5 flex flex-col bg-white dark:bg-transparent">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onPaste={handlePasteAttempt}
              onDrop={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              placeholder="Look at the upper box and start typing here. 10-minute exam timer will start automatically on your first keystroke..."
              className="court-exam-textarea w-full flex-1 bg-transparent text-slate-950 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 font-normal"
              style={{
                fontFamily: activeFontFamilyCss,
                fontSize: `${activeFontSizePx}px`,
                lineHeight: 1.65,
                letterSpacing: '0.01em',
              }}
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />

            {!startTime && (
              <div className="absolute bottom-4 right-6 pointer-events-none text-xs font-mono text-slate-600 dark:text-neutral-400 flex items-center gap-2 bg-slate-100/90 dark:bg-black/60 px-3 py-1.5 rounded-full border border-slate-300 dark:border-white/10 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Timer starts on first keypress</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="w-full max-w-md bento-card bg-white dark:bg-neutral-900 border border-slate-300 dark:border-white/20 p-6 rounded-3xl shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-500 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit Typing Test?</h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  {timeLimit > 0
                    ? `You have ${formatTime(remainingSeconds)} remaining.`
                    : 'Are you sure you want to finish your exam now?'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 text-slate-800 dark:text-neutral-300">
              <div>Words Typed: <strong className="text-slate-950 dark:text-white">{typedWords}</strong></div>
              <div>Total Strokes: <strong className="text-cyan-700 dark:text-cyan-400">{totalKeystrokesRef.current}</strong></div>
              <div>Elapsed Time: <strong className="text-amber-600 dark:text-amber-400">{formatTime(Math.floor(elapsed))}</strong></div>
              <div>Error Cutoff: <strong className="text-emerald-600 dark:text-emerald-400">≤ 5.00%</strong></div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  focusInput();
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
              >
                Keep Typing
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  finishTestRef.current?.();
                }}
                className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all keep-white"
              >
                Confirm & Submit Scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pause Overlay ── */}
      {isPaused && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={resumeTest}
        >
          <div
            className="w-full max-w-sm bento-card bg-white dark:bg-neutral-900 border border-amber-500/40 dark:border-amber-500/30 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-4 text-slate-900 dark:text-neutral-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl border border-amber-500/40 animate-pulse">
              ⏸️
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Test Paused</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1">
                {pauseReason === 'auto_idle'
                  ? 'Paused due to inactivity. Timer is frozen.'
                  : pauseReason === 'auto_blur'
                  ? 'Window lost focus. Stats are safely preserved.'
                  : 'Timer is frozen. Take a breath and resume when ready.'}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={resumeTest}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all keep-white"
              >
                ▶ Resume (Esc)
              </button>
              <button
                onClick={onRestart}
                className="py-3 px-4 rounded-xl font-semibold text-xs bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-neutral-300 transition-all"
              >
                ↺ Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
