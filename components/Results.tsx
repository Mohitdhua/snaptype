
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './Button';
import { TestResults, HardcoreMode } from '../types';
import { getHistory, calculateExamEvaluation, classifyTypo, getAdaptiveProfile, generateWeaknessDrill, generateCollisionRepairDrill } from '../services/storageService';
import { getStoredTheme } from '../services/themeService';
import { ProgressChart } from './ProgressChart';
import { CertificateModal } from './CertificateModal';
import { DiagnosticReportModal } from './DiagnosticReportModal';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { playSound } from '../services/soundService';

interface ResultsProps {
  results: TestResults;
  onReset: () => void;
  onNewImage: () => void;
  onPractice: (type: 'words' | 'keys') => void;
  onLaunchBooster?: (text: string, title: string, hardcore?: HardcoreMode) => void;
  onNextLesson?: () => void;
  nextLessonLabel?: string;
}

const roundTo = (value: number, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const MAX_SESSION_CHART_POINTS = 240;

const downsampleSeries = <T,>(series: T[], maxPoints: number): T[] => {
  if (series.length <= maxPoints) return series;
  const stride = Math.ceil(series.length / maxPoints);
  const reduced = series.filter((_, index) => index % stride === 0);
  const last = series[series.length - 1];
  if (reduced[reduced.length - 1] !== last) {
    reduced.push(last);
  }
  return reduced;
};

const normalizeHardKey = (key: string) => {
  if (key === '\n' || key === 'Enter') return 'Enter';
  if (key === ' ' || key === 'Space') return 'Space';
  return key;
};

const formatHardKeyLabel = (key: string) => {
  if (key === 'Space') return '[space]';
  if (key === 'Enter') return '[enter]';
  return key;
};

const SessionTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl z-50 text-xs">
        <p className="text-slate-500 dark:text-slate-400 font-bold mb-1">{`Time: ${label}s`}</p>
        <p className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">{`Net WPM: ${point?.wpm ?? 0}`}</p>
        <p className="text-slate-700 dark:text-slate-300">{`Raw WPM: ${point?.raw ?? 0}`}</p>
        <p className="text-emerald-600 dark:text-emerald-400">{`Accuracy: ${point?.accuracy ?? 0}%`}</p>
      </div>
    );
  }
  return null;
};

const HEATMAP_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['Space']
];

export const Results: React.FC<ResultsProps> = ({ results, onReset, onNewImage, onPractice, onLaunchBooster, onNextLesson, nextLessonLabel }) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showExamEval, setShowExamEval] = useState(results.isSSC || false);
  const [examCategory, setExamCategory] = useState<'UR' | 'OBC_SC_ST'>('UR');
  const [hardKeyView, setHardKeyView] = useState<'heatmap' | 'chips'>('heatmap');
  const [isLight, setIsLight] = useState(() => getStoredTheme() === 'light');

  useEffect(() => {
    const handler = () => setIsLight(getStoredTheme() === 'light');
    window.addEventListener('snaptype-theme-change', handler);
    return () => window.removeEventListener('snaptype-theme-change', handler);
  }, []);

  const kdph = useMemo(() => {
    if (results.kdph) return results.kdph;
    const mins = Math.max(0.08, results.timeElapsed / 60);
    return Math.round((results.totalChars / mins) * 60);
  }, [results.kdph, results.timeElapsed, results.totalChars]);

  const examEval = useMemo(() => {
    return results.examEval || calculateExamEvaluation(results, examCategory);
  }, [results, examCategory]);

  useEffect(() => {
      if ((results.badgesUnlocked && results.badgesUnlocked.length > 0) || (results.isSSC && (results.sscMarks || 0) > 0)) {
          const timeoutId = setTimeout(() => playSound('success'), 500);
          return () => clearTimeout(timeoutId);
      }
      return undefined;
  }, [results]);

  const normalizedHardKeys = useMemo(() => {
    const normalized: Record<string, number> = {};
    for (const [key, count] of Object.entries(results.hardKeys)) {
      const normalizedKey = normalizeHardKey(key).toLowerCase();
      normalized[normalizedKey] = (normalized[normalizedKey] || 0) + (count as number);
    }
    return normalized;
  }, [results.hardKeys]);

  const topHardKeys = useMemo(
    () => {
      const normalized: Record<string, number> = {};
      for (const [key, count] of Object.entries(results.hardKeys)) {
        const normalizedKey = normalizeHardKey(key);
        normalized[normalizedKey] = (normalized[normalizedKey] || 0) + (count as number);
      }

      return Object.entries(normalized)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 8);
    },
    [results.hardKeys]
  );

  const topMissedWords = useMemo(
    () =>
      Object.entries(results.missedWords || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 12),
    [results.missedWords]
  );

  const collisionInsights = useMemo(() => {
    const originalText = results.originalText || '';
    const typedText = results.typedText || '';
    const len = Math.min(originalText.length, typedText.length);
    let sameFinger = 0;
    let neighbor = 0;
    let totalErrors = 0;
    const conflicts: Record<string, { expected: string; typed: string; count: number; type: string }> = {};

    for (let i = 0; i < len; i++) {
      const expected = originalText[i].toLowerCase();
      const typed = typedText[i].toLowerCase();
      if (expected !== typed) {
        totalErrors++;
        const c = classifyTypo(expected, typed);
        if (c.type === 'SAME_FINGER_REACH') sameFinger++;
        else if (c.type === 'ADJACENT_NEIGHBOR') neighbor++;

        if (expected.trim() && typed.trim()) {
          const key = `${expected}→${typed}`;
          if (!conflicts[key]) conflicts[key] = { expected, typed, count: 0, type: c.type };
          conflicts[key].count++;
        }
      }
    }

    const sameRatio = totalErrors > 0 ? Math.round((sameFinger / totalErrors) * 100) : 0;
    const neighborRatio = totalErrors > 0 ? Math.round((neighbor / totalErrors) * 100) : 0;
    const topPairs = Object.values(conflicts).sort((a, b) => b.count - a.count).slice(0, 4);

    return { totalErrors, sameFinger, neighbor, sameRatio, neighborRatio, topPairs };
  }, [results.originalText, results.typedText]);

  const sessionHistory = results.history || [];
  const sessionChartData = useMemo(
    () => downsampleSeries(sessionHistory, MAX_SESSION_CHART_POINTS),
    [sessionHistory]
  );
  const sameTestHistory = useMemo(() => {
    if (!results.testId) return [];
    return getHistory().filter(entry => entry.testId === results.testId);
  }, [results.testId]);

  const sessionInsights = useMemo(() => {
    if (sessionHistory.length === 0) {
      return {
        peakWpm: results.netWpm,
        avgWpm: results.netWpm,
        avgAcc: results.accuracy,
        stability: 0,
        trendDelta: 0,
      };
    }

    const wpmValues = sessionHistory.map(point => point.wpm);
    const accuracyValues = sessionHistory.map(point => point.accuracy);
    const avgWpm = wpmValues.reduce((sum, value) => sum + value, 0) / wpmValues.length;
    const avgAcc = accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length;
    const variance = wpmValues.reduce((sum, value) => sum + (value - avgWpm) ** 2, 0) / wpmValues.length;
    const trendDelta = wpmValues[wpmValues.length - 1] - wpmValues[0];

    return {
      peakWpm: Math.max(...wpmValues),
      avgWpm: roundTo(avgWpm, 1),
      avgAcc: roundTo(avgAcc, 1),
      stability: roundTo(Math.sqrt(variance), 1),
      trendDelta: roundTo(trendDelta, 1),
    };
  }, [results.accuracy, results.netWpm, sessionHistory]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center animate-scale-in pb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-stitch-accent mb-8">
            Session Report
        </h2>

        {/* Badge / XP Notification */}
        {(results.badgesUnlocked && results.badgesUnlocked.length > 0) || results.xpGained ? (
            <div className="w-full mb-8 bento-card border border-slate-200 dark:border-white/20 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <span className="text-2xl text-amber-500 dark:text-white">★</span>
                    <div>
                        <div className="text-slate-900 dark:text-white font-bold">Session Complete!</div>
                        <div className="text-slate-500 dark:text-stitch-muted text-sm">You earned <span className="font-bold text-slate-900 dark:text-white">+{results.xpGained || 0} XP</span></div>
                    </div>
                </div>
                {results.badgesUnlocked && results.badgesUnlocked.length > 0 && (
                     <div className="flex gap-2">
                        {results.badgesUnlocked.map(badge => (
                            <div key={badge.id} className="flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                <span className="text-lg">{badge.icon}</span>
                                <span className="font-bold text-sm">{badge.name} Unlocked!</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : null}
        
        {/* SSC Mode Scorecard */}
        {results.isSSC && (
            <div className="w-full bento-card p-6 mb-8 relative overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">SSC MODE</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                        <div className="text-xs text-slate-500 dark:text-stitch-muted uppercase font-bold mb-1">Total Strokes</div>
                        <div className="text-3xl font-mono text-slate-900 dark:text-white font-bold">{results.totalChars}</div>
                        <div className="text-xs text-slate-400 dark:text-stitch-muted mt-1">Words: {Math.round(results.totalChars / 5)}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                        <div className="text-xs text-slate-500 dark:text-stitch-muted uppercase font-bold mb-1">Mistakes Penalty</div>
                        <div className="text-3xl font-mono text-red-500 dark:text-red-400 font-bold">-{results.incorrectChars} <span className="text-sm">WPM</span></div>
                        <div className="text-xs text-slate-400 dark:text-stitch-muted mt-1">1 WPM per mistake</div>
                    </div>
                     <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/20">
                        <div className="text-xs text-slate-500 dark:text-white uppercase font-bold mb-1">Marks Obtained</div>
                        <div className="text-4xl font-mono font-black text-slate-900 dark:text-white">{results.sscMarks || 0}<span className="text-lg text-slate-400 dark:text-stitch-muted font-normal">/25</span></div>
                        <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded ${results.netWpm >= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'}`}>
                            {results.netWpm >= 30 ? 'QUALIFIED' : 'DISQUALIFIED'}
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-center text-xs text-slate-400 dark:text-stitch-muted">
                    Formula: (Strokes / 5) / Time - Mistakes = Net Speed
                </div>
            </div>
        )}

        {/* Ghost Pacer Race Result Banner */}
        {results.ghostWpm && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 dark:from-purple-950/60 dark:via-indigo-950/40 dark:to-neutral-900 border border-purple-200 dark:border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏎️</span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-700 dark:text-purple-300 font-bold">
                  Ghost Pacer Challenge ({results.ghostWpm} WPM Benchmark)
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {results.netWpm >= results.ghostWpm
                    ? `Victory! You outpaced the ${results.ghostWpm} WPM target by +${results.netWpm - results.ghostWpm} WPM!`
                    : `Close race! You finished only ${results.ghostWpm - results.netWpm} WPM behind the target pace.`}
                </h4>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl ${
              results.netWpm >= results.ghostWpm ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
            }`}>
              {results.netWpm >= results.ghostWpm ? 'PACER BEATEN ⚡' : 'CADENCE RECOVERY 🎯'}
            </span>
          </div>
        )}

        {/* Next Exercise / Lesson Banner */}
        {onNextLesson && nextLessonLabel && (
          <div className="w-full mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-neutral-950/50 border border-emerald-200 dark:border-emerald-500/40 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                🚀
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
                  Curriculum Advancement
                </span>
                <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                  Exercise Complete! Ready for the next drill?
                </h4>
              </div>
            </div>

            <button
              onClick={onNextLesson}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-black transition-all shadow-[0_0_20px_rgba(52,211,153,0.35)] flex items-center justify-center gap-2 font-mono shrink-0"
            >
              <span>{nextLessonLabel}</span>
            </button>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full mb-8">
            <div className="bento-card flex flex-col items-center justify-center py-6 shadow-xs relative overflow-hidden group">
                <span className="text-slate-900 dark:text-white font-black text-4xl md:text-5xl mb-1">{results.netWpm}</span>
                <span className="text-slate-500 dark:text-stitch-muted font-bold uppercase tracking-widest text-[11px]">{results.isSSC ? 'Actual Speed' : 'Net WPM'}</span>
                <span className="text-slate-400 dark:text-stitch-muted text-[10px] mt-1">{results.isSSC ? 'After penalty' : 'Adjusted speed'}</span>
            </div>

            <div className="bento-card flex flex-col items-center justify-center py-6 shadow-xs">
                <span className="text-slate-800 dark:text-stitch-accent font-bold text-3xl mb-1">{results.rawWpm}</span>
                <span className="text-slate-500 dark:text-stitch-muted font-bold uppercase tracking-widest text-[11px]">{results.isSSC ? 'Tentative Speed' : 'Raw WPM'}</span>
                 <span className="text-slate-400 dark:text-stitch-muted text-[10px] mt-1">Gross speed</span>
            </div>

             <div className="bento-card flex flex-col items-center justify-center py-6 shadow-xs">
                <span className={`${results.accuracy > 95 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} font-bold text-3xl mb-1`}>{results.accuracy}%</span>
                <span className="text-slate-500 dark:text-stitch-muted font-bold uppercase tracking-widest text-[11px]">Final Accuracy</span>
                <span className="text-slate-400 dark:text-stitch-muted text-[10px] mt-1">
                  {results.realAccuracy !== undefined && results.realAccuracy !== results.accuracy
                    ? `Real: ${results.realAccuracy}% (${results.backspaceCount ?? 0} ⌫)`
                    : `${results.incorrectChars} errors`}
                </span>
            </div>

             <div className="bento-card flex flex-col items-center justify-center py-6 shadow-xs">
                <div className="flex gap-3 items-end mb-1">
                    <div className="flex flex-col items-center">
                         <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xl">{results.correctChars}</span>
                         <span className="text-[9px] text-slate-500 dark:text-stitch-muted uppercase">Correct</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/20"></div>
                     <div className="flex flex-col items-center">
                         <span className="text-rose-600 dark:text-rose-400 font-bold text-xl">{results.incorrectChars}</span>
                         <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">Wrong</span>
                    </div>
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px]">Keystrokes</span>
            </div>

            <div className="bento-card flex flex-col items-center justify-center py-6 shadow-xs border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/10">
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-3xl mb-1">{kdph}</span>
                <span className="text-slate-500 dark:text-stitch-muted font-bold uppercase tracking-widest text-[11px]">KDPH Rate</span>
                <span className="text-slate-400 dark:text-stitch-muted text-[10px] mt-1">Depressions / hr</span>
            </div>

            <div className="bento-card flex flex-col items-center justify-center py-6 shadow-xs border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-950/10">
                <span className="text-cyan-700 dark:text-cyan-300 font-mono font-bold text-3xl mb-1">{results.avgLatencyMs || 165}<span className="text-xs">ms</span></span>
                <span className="text-slate-500 dark:text-stitch-muted font-bold uppercase tracking-widest text-[11px]">Reflex Latency</span>
                <span className="text-slate-400 dark:text-stitch-muted text-[10px] mt-1">Inter-key reaction</span>
            </div>
        </div>

        {/* Real vs Net Accuracy Diagnostic Card */}
        <div className="w-full mb-8 bento-card p-6 border border-slate-200 dark:border-white/15 rounded-2xl relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Keystroke Fidelity Diagnostic (Real vs Net Accuracy Audit)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
                वास्तविक की-स्ट्रोक शुद्धता (बिना बैकस्पेस) बनाम फाइनल सबमिट की गई शुद्धता का गहन विश्लेषण।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                (results.realAccuracy ?? results.accuracy) >= 95
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                  : (results.realAccuracy ?? results.accuracy) >= 88
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
              }`}>
                Real Acc: {results.realAccuracy ?? results.accuracy}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400 font-semibold">Net / Exam Accuracy</span>
              <div className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">{results.accuracy}%</div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Final submitted text</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-cyan-700 dark:text-cyan-300 font-semibold">Real Keystroke Accuracy</span>
              <div className="text-3xl font-mono font-bold text-cyan-700 dark:text-cyan-300 mt-1">{results.realAccuracy ?? results.accuracy}%</div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Raw muscle memory</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-300 font-semibold">Backspace Usage</span>
              <div className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-300 mt-1">{results.backspaceCount ?? 0} <span className="text-sm font-normal">hits</span></div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{results.correctedErrors ?? 0} errors corrected</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-rose-700 dark:text-rose-300 font-semibold">Total Raw Mistakes</span>
              <div className="text-3xl font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">{results.totalRawErrors ?? results.incorrectChars}</div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{results.incorrectChars} left uncorrected</span>
            </div>
          </div>

          {/* Diagnostic Muscle Memory Advice */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono">
            {(results.backspaceCount || 0) > 3 && (results.realAccuracy ?? results.accuracy) < results.accuracy ? (
              <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-200">
                <span className="text-base shrink-0">⚠️</span>
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300">Backspace Reliance Detected (बैकस्पेस की आदत):</span>
                  <p className="text-slate-700 dark:text-neutral-300 text-[11px] mt-0.5 leading-relaxed">
                    आपने टेस्ट के दौरान <strong>{results.backspaceCount} बार बैकस्पेस</strong> दबाकर गलतियों को ठीक किया। इससे फाइनल एक्यूरेसी तो <strong>{results.accuracy}%</strong> दिख रही है, लेकिन रियल की-स्ट्रोक शुद्धता <strong>{results.realAccuracy}%</strong> है। बैकस्पेस दबाने से आपकी टाइपिंग स्पीड (WPM) और रिफ्लेक्स फ्लो कम होता है। परीक्षा में स्पीड बनाए रखने के लिए <em>पहली बार में ही सही की दबाने</em> (Accuracy-First Muscle Memory) का अभ्यास करें।
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200">
                <span className="text-base shrink-0">⚡</span>
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">Pure Muscle Memory (उत्कृष्ट की-स्ट्रोक नियंत्रण):</span>
                  <p className="text-slate-700 dark:text-neutral-300 text-[11px] mt-0.5 leading-relaxed">
                    शानदार नियंत्रण! आपकी रियल और फाइनल एक्यूरेसी बहुत संतुलित हैं ({results.realAccuracy ?? results.accuracy}%) और बैकस्पेस का इस्तेमाल केवल {results.backspaceCount ?? 0} बार हुआ है। आपका कीबोर्ड पर नियंत्रण प्रोफेशनल लेवल का है।
                  </p>
                </div>
              </div>
            )}
            {/* Direct Actionable Booster CTAs */}
            <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-neutral-400">Actionable Prescription:</span>
                <span className="text-xs text-slate-700 dark:text-neutral-300">
                  {(results.backspaceCount || 0) > 3
                    ? '3-day No-Backspace challenge recommended to lock in 96%+ raw muscle precision.'
                    : 'Maintain precision with sustained rhythmic paragraphs.'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onLaunchBooster && (
                  <button
                    onClick={() => {
                      const profile = getAdaptiveProfile();
                      let drill = generateWeaknessDrill(profile);
                      if (!drill || drill.length < 40) {
                        drill = results.typedText && results.typedText.length > 50
                          ? results.typedText.slice(0, 350)
                          : 'focus rhythm cadence precision accuracy flow muscle memory speed judge master form clerk test court';
                      }
                      onLaunchBooster(drill, 'Real Accuracy Booster (No Backspace)', 'NO_BACKSPACE');
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black shadow-md flex items-center gap-1.5 font-mono"
                  >
                    <span>⚡ Boost Real Accuracy (No Backspace)</span>
                    <span>→</span>
                  </button>
                )}

                {onLaunchBooster && collisionInsights.topPairs.length > 0 && (
                  <button
                    onClick={() => {
                      const profile = getAdaptiveProfile();
                      const topPair = collisionInsights.topPairs[0];
                      const drill = generateCollisionRepairDrill(profile, `${topPair.expected}-${topPair.typed}`);
                      onLaunchBooster(drill, `Collision Fix (${topPair.expected.toUpperCase()} ↔ ${topPair.typed.toUpperCase()})`, 'NO_BACKSPACE');
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-400 dark:text-black dark:hover:bg-cyan-300 shadow-md flex items-center gap-1.5 font-mono"
                  >
                    <span>🎯 Disentangle {collisionInsights.topPairs[0].expected.toUpperCase()} ↔ {collisionInsights.topPairs[0].typed.toUpperCase()}</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Official High Court & SSC Exam Evaluation Section */}
        <div className="w-full mb-8 bento-card p-6 border border-slate-200 dark:border-white/15 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Official Exam Evaluation (Court & SSC Typing Criteria)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
                Evaluated against High Court, SSC CGL/CHSL, and State Clerk exam standards.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">Category:</span>
              <button
                onClick={() => setExamCategory('UR')}
                className={`text-xs px-3 py-1 rounded-lg font-mono font-bold transition-colors ${examCategory === 'UR' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                UR (5% Max Err)
              </button>
              <button
                onClick={() => setExamCategory('OBC_SC_ST')}
                className={`text-xs px-3 py-1 rounded-lg font-mono font-bold transition-colors ${examCategory === 'OBC_SC_ST' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Reserved (7% Max Err)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400">Total Key Depressions</span>
              <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">{examEval.totalKeyDepressions}</span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">KDPH: {examEval.kdph}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400">Full Mistakes</span>
              <span className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">{examEval.fullMistakes}</span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Omission / Substitution</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400">Half Mistakes</span>
              <span className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mt-1">{examEval.halfMistakes}</span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Punctuation / Spelling</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400">Error Percentage</span>
              <span className={`text-2xl font-mono font-bold mt-1 ${examEval.errorPercentage <= examEval.maxAllowedError ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {examEval.errorPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Allowed &le; {examEval.maxAllowedError}%</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center col-span-2 md:col-span-1 justify-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400 mb-1">Result Status</span>
              <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
                examEval.status === 'QUALIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
              }`}>
                {examEval.status}
              </span>
            </div>
          </div>
        </div>

        {/* Session Performance */}
        <div className="w-full mb-8 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-xs">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Peak WPM</div>
                    <div className="text-xl font-mono text-indigo-600 dark:text-indigo-300 font-bold">{sessionInsights.peakWpm}</div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-xs">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg WPM</div>
                    <div className="text-xl font-mono text-cyan-700 dark:text-cyan-300 font-bold">{sessionInsights.avgWpm}</div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-xs">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg Accuracy</div>
                    <div className="text-xl font-mono text-emerald-600 dark:text-emerald-300 font-bold">{sessionInsights.avgAcc}%</div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-xs">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Pacing Trend</div>
                    <div className={`text-xl font-mono font-bold ${sessionInsights.trendDelta >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                        {sessionInsights.trendDelta >= 0 ? '+' : ''}
                        {sessionInsights.trendDelta}
                    </div>
                </div>
            </div>

            {sessionChartData.length > 2 && (
                <div className="w-full h-80 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs flex flex-col">
                    <h3 className="text-slate-700 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Session Performance</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={sessionChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#334155"} vertical={false} />
                                <XAxis dataKey="time" tickFormatter={value => `${value}s`} stroke={isLight ? "#94a3b8" : "#64748b"} tick={{ fontSize: 11, fill: isLight ? "#64748b" : "#94a3b8" }} tickLine={false} axisLine={false} />
                                <YAxis
                                    yAxisId="speed"
                                    stroke={isLight ? "#94a3b8" : "#64748b"}
                                    tick={{ fontSize: 11, fill: isLight ? "#64748b" : "#94a3b8" }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, (dataMax: number) => Math.max(20, Math.ceil((dataMax + 8) / 10) * 10)]}
                                />
                                <YAxis
                                    yAxisId="accuracy"
                                    orientation="right"
                                    stroke={isLight ? "#059669" : "#34d399"}
                                    tick={{ fontSize: 11, fill: isLight ? "#059669" : "#34d399" }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip content={<SessionTooltip />} cursor={{ stroke: isLight ? '#cbd5e1' : '#475569', strokeWidth: 1 }} />
                                <Area yAxisId="accuracy" type="monotone" dataKey="accuracy" stroke="#34d399" fill="#34d399" fillOpacity={isLight ? 0.15 : 0.08} />
                                <Line yAxisId="speed" type="monotone" dataKey="wpm" stroke="#818cf8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#818cf8' }} animationDuration={1000} />
                                <Line yAxisId="speed" type="monotone" dataKey="raw" stroke={isLight ? "#64748b" : "#94a3b8"} strokeWidth={1.8} dot={false} strokeDasharray="5 4" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {sessionChartData.length > 2 && (
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 flex flex-wrap gap-3">
                    <span className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 text-xs shadow-2xs">{`Stability sigma: ${sessionInsights.stability}`}</span>
                    <span className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 text-xs shadow-2xs">
                        {sessionInsights.trendDelta >= 3 ? 'Strong finish' : sessionInsights.trendDelta <= -3 ? 'Early spike, then fade' : 'Steady pacing'}
                    </span>
                </div>
            )}
        </div>

        {results.testId && sameTestHistory.length >= 1 && (
            <div className="w-full mb-8 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-slate-800 dark:text-slate-300 font-bold uppercase tracking-wider text-sm">This Test Performance</h3>
                    <span className="text-xs text-slate-500">{`${sameTestHistory.length} attempts on this test`}</span>
                </div>
                <ProgressChart
                    history={sameTestHistory}
                    highlightId={sameTestHistory[sameTestHistory.length - 1]?.id}
                    className="h-80"
                />
            </div>
        )}

        {/* Practice Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            {/* Hard Keys Section */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full relative group shadow-xs">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Diagnostic Hard Keys
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHardKeyView(v => v === 'heatmap' ? 'chips' : 'heatmap')}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-600 font-medium transition-colors"
                      >
                        {hardKeyView === 'heatmap' ? 'List View' : 'Heatmap View'}
                      </button>
                      {topHardKeys.length > 0 && (
                        <button 
                            onClick={() => onPractice('keys')}
                            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 px-3 py-1 rounded-full font-semibold transition-colors border border-rose-200 dark:border-rose-500/20"
                        >
                            Practice Keys
                        </button>
                      )}
                    </div>
                </div>
                
                {hardKeyView === 'heatmap' ? (
                  <div className="flex flex-col gap-1.5 w-full items-center my-auto p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 select-none">
                    {HEATMAP_LAYOUT.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-1 justify-center w-full">
                        {row.map((k) => {
                          const count = normalizedHardKeys[k.toLowerCase()] || 0;
                          const isSpace = k === 'Space';
                          let colorClass = 'bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-500 border-slate-200 dark:border-slate-800/80 shadow-2xs';
                          if (count === 1) {
                            colorClass = 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)] font-bold';
                          } else if (count >= 2) {
                            colorClass = 'bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.35)] font-bold animate-pulse';
                          }

                          return (
                            <div
                              key={k}
                              className={`h-8 rounded-lg flex items-center justify-center font-mono text-[11px] border relative transition-all ${isSpace ? 'w-44' : 'w-7 sm:w-8'} ${colorClass}`}
                              title={`Key ${k}: ${count} error(s)`}
                            >
                              <span>{isSpace ? '—' : k.toUpperCase()}</span>
                              {count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                                  {count}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800" />
                        <span>0 errors</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-amber-200 dark:bg-amber-500/40 border border-amber-400 dark:border-amber-500" />
                        <span>1 error</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-rose-200 dark:bg-rose-500/50 border border-rose-400 dark:border-rose-500" />
                        <span>2+ errors</span>
                      </div>
                    </div>
                  </div>
                ) : topHardKeys.length > 0 ? (
                    <div className="flex flex-wrap gap-3 content-start">
                        {topHardKeys.map(([key, count]) => (
                            <div key={key} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="bg-slate-200 dark:bg-slate-700 min-w-[32px] h-8 flex items-center justify-center text-lg font-mono font-bold text-slate-800 dark:text-white rounded">
                                    {formatHardKeyLabel(key)}
                                </div>
                                <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">x{count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 italic text-sm py-4">
                        Great job! No specific problem keys detected.
                    </div>
                )}
            </div>

            {/* Missed Words Section */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full relative shadow-xs">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Missed Words
                    </h3>
                    {topMissedWords.length > 0 && (
                         <button 
                            onClick={() => onPractice('words')}
                            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full font-semibold transition-colors border border-amber-200 dark:border-amber-500/20"
                        >
                            Practice Words
                        </button>
                    )}
                </div>

                {topMissedWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 content-start">
                        {topMissedWords.map(([word, count]) => (
                            <div key={word} className="group relative bg-slate-50 border border-slate-200 hover:border-amber-500 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-amber-500/50 rounded px-3 py-1 text-sm text-slate-800 dark:text-slate-300 font-mono transition-colors">
                                {word}
                                <span className="ml-2 text-amber-600 dark:text-amber-500 text-xs font-bold">x{count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 italic text-sm py-4">
                        Perfection! No words were missed.
                    </div>
                )}
            </div>
        </div>
          {/* Biomechanical Collision & Tendon Analysis Card */}
        {collisionInsights.totalErrors > 0 && (
          <div className="w-full bg-white dark:bg-slate-900/80 border border-cyan-400/40 dark:border-cyan-500/30 rounded-2xl p-5 md:p-6 mb-8 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-cyan-500 font-bold">⚡</span>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider font-mono">
                  Biomechanical Finger Collision & Tendon Audit
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30 font-semibold">
                Hardware & Neuromuscular Diagnostic
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 uppercase block font-semibold">Same-Finger Reach Overshoot</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {collisionInsights.sameRatio}% <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({collisionInsights.sameFinger} errors)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Single finger confusion across multi-key reach columns (e.g. R↔T, F↔G, V↔B).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 uppercase block font-semibold">Neighbor Finger Tendon Crosstalk</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {collisionInsights.neighborRatio}% <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({collisionInsights.neighbor} errors)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Adjacent fingers co-firing due to linked extensor tendons (e.g. Ring W↔Middle E, S↔D).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 uppercase block font-semibold">Top Active Conflicts</span>
                  {collisionInsights.topPairs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {collisionInsights.topPairs.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-cyan-100 border border-cyan-300 text-cyan-900 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-200 font-mono text-[11px] font-bold">
                          {p.expected.toUpperCase()} ↔ {p.typed.toUpperCase()} <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">({p.count}x)</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 block">Clean finger isolation!</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-cyan-700 dark:text-cyan-400/80 mt-2">
                  Tip: Use Academy "Finger Collision Fix" to isolate tendons.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full justify-center">
            {onNextLesson && nextLessonLabel && (
              <button
                onClick={onNextLesson}
                className="w-full sm:w-auto px-7 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-black transition-all shadow-[0_0_25px_rgba(52,211,153,0.35)] flex items-center justify-center gap-2 font-mono"
              >
                <span>{nextLessonLabel}</span>
              </button>
            )}
            <Button onClick={onReset} className="w-full sm:w-auto">
                Retry Same Test
            </Button>
            {onLaunchBooster && results.originalText && (
              <button
                onClick={() => onLaunchBooster(results.originalText!, 'Retest (Accuracy First)', 'NO_BACKSPACE')}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 dark:border-amber-500/40 transition-all flex items-center justify-center gap-2 font-mono shadow-xs"
                title="Retest this exact passage with Backspace disabled to build 96%+ raw muscle precision"
              >
                <span>🛡️ Retest (No Backspace)</span>
              </button>
            )}
            <button
                onClick={() => setShowCertificate(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:brightness-110 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Claim Official Certificate</span>
            </button>
            <button
                onClick={() => setShowDiagnosticModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
            >
                <span>🖨️ Candidate Diagnostic Report</span>
            </button>
             <Button onClick={onNewImage} variant="secondary" className="w-full sm:w-auto">
                Upload New Image
            </Button>
        </div>

        {showCertificate && (
          <CertificateModal results={results} onClose={() => setShowCertificate(false)} />
        )}

        {showDiagnosticModal && (
          <DiagnosticReportModal results={results} onClose={() => setShowDiagnosticModal(false)} />
        )}
    </div>
  );
};
