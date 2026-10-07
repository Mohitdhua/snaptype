import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TestResults, HardcoreMode } from '../types';
import { getStoredTheme } from '../services/themeService';
import { CertificateModal } from './CertificateModal';
import { DiagnosticReportModal } from './DiagnosticReportModal';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { playSound } from '../services/soundService';
import { evaluateCourtTypingTest, generateFullComparison } from '../services/courtEvaluationService';

interface ResultsProps {
  results: TestResults;
  onReset: () => void;
  onNewImage: () => void;
  onPractice: (type: 'words' | 'keys') => void;
  onLaunchBooster?: (text: string, title: string, hardcore?: HardcoreMode) => void;
  onNextLesson?: () => void;
  nextLessonLabel?: string;
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const roundTo = (value: number, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

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

const SessionTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0]?.payload;
    return (
      <div className="bg-slate-900/95 text-white border border-white/10 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
        <p className="text-slate-400 mb-0.5">{`Time: ${label}s`}</p>
        <p className="text-emerald-400 font-bold">{`Net: ${point?.wpm ?? 0} WPM`}</p>
        <p className="text-slate-300">{`Gross: ${point?.raw ?? 0} WPM`}</p>
        <p className="text-cyan-400">{`Accuracy: ${point?.accuracy ?? 0}%`}</p>
      </div>
    );
  }
  return null;
};

export const Results: React.FC<ResultsProps> = ({
  results,
  onReset,
  onNewImage,
  onPractice,
  onNextLesson,
  nextLessonLabel,
}) => {
  const [showCertificate, setShowCertificate] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showPassageReview, setShowPassageReview] = useState(false);
  const [isLight, setIsLight] = useState(() => getStoredTheme() === 'light');

  useEffect(() => {
    const handler = () => setIsLight(getStoredTheme() === 'light');
    window.addEventListener('snaptype-theme-change', handler);
    return () => window.removeEventListener('snaptype-theme-change', handler);
  }, []);

  // Keyboard navigation: Enter -> next drill / retry, Tab -> retry, Esc -> home
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (showCertificate || showDiagnosticModal) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onNextLesson) {
          onNextLesson();
        } else {
          onReset();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onReset();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onNewImage();
      }
    },
    [onNextLesson, onReset, onNewImage, showCertificate, showDiagnosticModal]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (results.accuracy >= 95) {
      const timeoutId = setTimeout(() => playSound('success'), 300);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [results.accuracy]);

  const courtEvaluation = useMemo(() => {
    if (results.courtExam) return results.courtExam;
    if (results.isCourtExam || results.isSSC) {
      return evaluateCourtTypingTest(
        results.originalText || '',
        results.typedText || '',
        results.timeElapsed || 600,
        results.typedText?.length || results.totalChars
      );
    }
    return null;
  }, [results]);

  const fullComparisonData = useMemo(() => {
    if (!showPassageReview) return null;
    const orig = results.originalText || '';
    const typed = results.typedText || '';
    if (orig.trim() || typed.trim()) {
      return generateFullComparison(orig, typed);
    }
    return null;
  }, [showPassageReview, results.originalText, results.typedText]);

  const sessionHistory = results.history || [];
  const sessionChartData = useMemo(
    () => downsampleSeries(sessionHistory, 180),
    [sessionHistory]
  );

  const sessionInsights = useMemo(() => {
    if (sessionHistory.length === 0) {
      return {
        peakWpm: results.netWpm,
        avgWpm: results.netWpm,
      };
    }
    const wpmValues = sessionHistory.map(point => point.wpm);
    const avgWpm = wpmValues.reduce((sum, value) => sum + value, 0) / wpmValues.length;
    return {
      peakWpm: Math.max(...wpmValues),
      avgWpm: roundTo(avgWpm, 1),
    };
  }, [results.netWpm, sessionHistory]);

  const topMissedWords = useMemo(
    () =>
      Object.entries(results.missedWords || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 6),
    [results.missedWords]
  );

  const topHardKeys = useMemo(
    () =>
      Object.entries(results.hardKeys || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 6),
    [results.hardKeys]
  );

  const handlePrintScorecard = () => {
    if (!courtEvaluation) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SSSC Typing Examination Official Scorecard</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; padding: 24px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { font-size: 17pt; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .header p { margin: 4px 0 0; font-size: 11pt; color: #475569; }
            .verdict-box {
              padding: 16px; text-align: center;
              border: 2px solid ${courtEvaluation.status === 'QUALIFIED' ? '#059669' : '#e11d48'};
              background-color: ${courtEvaluation.status === 'QUALIFIED' ? '#ecfdf5' : '#fff1f2'};
              border-radius: 12px; margin-bottom: 24px;
            }
            .verdict-title { font-size: 18pt; font-weight: 800; color: ${courtEvaluation.status === 'QUALIFIED' ? '#059669' : '#e11d48'}; letter-spacing: 1px; }
            .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .stats-table th, .stats-table td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            .stats-table th { background: #f8fafc; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
            .stats-table td { font-size: 11pt; font-weight: 600; font-family: monospace; }
            .formula-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-family: monospace; font-size: 11pt; margin-bottom: 20px; color: #334155; }
            .notice { font-size: 9.5pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>High Court of Punjab and Haryana at Chandigarh</h1>
            <p>Society for Centralized Recruitment of Staff in Subordinate Courts (S.S.S.C.)</p>
            <p><strong>Computer Proficiency Test (CPT) • Official English Typing Scorecard</strong></p>
          </div>
          <div class="verdict-box">
            <div class="verdict-title">${courtEvaluation.status === 'QUALIFIED' ? 'QUALIFIED / PASSED' : 'DISQUALIFIED'}</div>
            <div style="margin-top: 6px; font-size: 11pt;">${courtEvaluation.status === 'QUALIFIED' ? 'Candidate meets both Net Speed (≥ 30.00 WPM) and Accuracy (Mistakes ≤ 5.00%) recruitment benchmarks.' : courtEvaluation.disqualificationReasons.join(' • ')}</div>
          </div>
          <table class="stats-table">
            <tr><th>Examination Parameter</th><th>Candidate Performance</th><th>Official Qualifying Benchmark</th></tr>
            <tr><td>Total Characters Typed</td><td>${courtEvaluation.totalKeyDepressions}</td><td>—</td></tr>
            <tr><td>Gross Words (Chars / 5)</td><td>${courtEvaluation.grossWords} words</td><td>—</td></tr>
            <tr><td>Gross Speed</td><td>${courtEvaluation.grossWpm} WPM</td><td>—</td></tr>
            <tr><td>Total Mistakes (Omissions + Substitutions + Additions)</td><td>${courtEvaluation.totalMistakes} (O:${courtEvaluation.omissionsCount}, S:${courtEvaluation.substitutionsCount}, A:${courtEvaluation.additionsCount})</td><td>1 word deduction / mistake</td></tr>
            <tr><td>Net Words (Gross - Mistakes)</td><td>${courtEvaluation.netWords} words</td><td>—</td></tr>
            <tr><td><strong>Net Speed (WPM)</strong></td><td><strong>${courtEvaluation.netWpm} WPM</strong></td><td><strong>Minimum 30.00 WPM</strong></td></tr>
            <tr><td><strong>Error Rate (%)</strong></td><td><strong>${courtEvaluation.errorPercentage}%</strong></td><td><strong>Maximum 5.00%</strong></td></tr>
            <tr><td>Final Accuracy</td><td>${courtEvaluation.accuracy}%</td><td>Minimum 95.00%</td></tr>
          </table>
          <div class="formula-box">
            Official SSSC Formula: Net Speed = (Gross Words - Total Mistakes) ÷ 10 Minutes = (${courtEvaluation.grossWords} - ${courtEvaluation.totalMistakes}) ÷ 10 = ${courtEvaluation.netWpm} WPM
          </div>
          <div class="notice">
            ${courtEvaluation.spreadsheetNotice}
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-6 animate-fade-in text-slate-900 dark:text-neutral-100">
      {/* ── 1. Minimal Top Navigation ── */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onNewImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Return to Home (Esc)"
          >
            <span>←</span>
            <span>Home</span>
          </button>
          <span className="text-slate-300 dark:text-neutral-700 font-mono text-xs">/</span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-neutral-400 font-semibold">
            {courtEvaluation ? 'CPT Examination' : results.lessonId ? 'Curriculum Drill' : 'Test Result'}
          </span>
          {results.ghostWpm && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              ⚡ {results.ghostWpm} WPM Pacer {results.netWpm >= results.ghostWpm ? 'Beaten' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {courtEvaluation && (
            <button
              onClick={handlePrintScorecard}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print official scorecard"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Scorecard</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Retry test (Tab)"
          >
            <span>↺</span>
            <span>Retry</span>
            <span className="hidden sm:inline text-[9px] text-slate-400 dark:text-neutral-500 font-normal">Tab</span>
          </button>

          {onNextLesson && nextLessonLabel && (
            <button
              onClick={onNextLesson}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Proceed to next exercise (Enter)"
            >
              <span>{nextLessonLabel}</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-normal">↵</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. Official Court Exam Verdict Badge (If Court / SSC Mode) ── */}
      {courtEvaluation && (
        <div className={`mt-5 p-4 rounded-2xl border transition-all ${
          courtEvaluation.status === 'QUALIFIED'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{courtEvaluation.status === 'QUALIFIED' ? '🏛️' : '⚠️'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-75">
                    High Court of Punjab & Haryana / S.S.S.C. CPT
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                    courtEvaluation.status === 'QUALIFIED'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {courtEvaluation.status}
                  </span>
                </div>
                <p className="text-xs mt-0.5 font-mono">
                  {courtEvaluation.status === 'QUALIFIED'
                    ? `Qualified! Net speed ${courtEvaluation.netWpm} WPM (≥30 req) with ${courtEvaluation.errorPercentage}% mistakes (≤5% req).`
                    : courtEvaluation.disqualificationReasons.join(' • ')}
                </p>
              </div>
            </div>

            <button
              onClick={handlePrintScorecard}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white dark:bg-black/40 border border-current hover:opacity-80 transition-opacity"
            >
              Print Scorecard 🖨️
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Ultra-Sleek Hero Metrics Showcase ── */}
      <section className="mt-6 p-6 sm:p-8 rounded-3xl bg-slate-50/60 dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Top Hero Row: Big WPM & Core Stat Shelf */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-white/10">
            {/* Primary Centerpiece: Net Speed */}
            <div className="flex flex-col">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-neutral-400 font-bold mb-1">
                Net Speed
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter text-slate-900 dark:text-white leading-none">
                  {results.netWpm}
                </span>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    WPM
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                    adjusted
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Secondary Metrics Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 shrink-0 font-mono">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500">Gross</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-neutral-200 mt-0.5">
                  {results.rawWpm}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-neutral-500">wpm</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500">Accuracy</span>
                <span className={`text-2xl sm:text-3xl font-black mt-0.5 ${
                  results.accuracy >= 97 ? 'text-emerald-600 dark:text-emerald-400' : results.accuracy >= 90 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {results.accuracy}%
                </span>
                <span className="text-[9px] text-slate-400 dark:text-neutral-500">precision</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500">Net Chars</span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {results.correctChars}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-neutral-500">of {results.totalChars}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-neutral-500">Mistakes</span>
                <span className={`text-2xl sm:text-3xl font-black mt-0.5 ${
                  results.incorrectChars === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}>
                  {results.incorrectChars === 0 ? '0 ✓' : results.incorrectChars}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-neutral-500">errors</span>
              </div>
            </div>
          </div>

          {/* Minimal Cadence Sparkline Curve */}
          {sessionChartData.length > 2 && (
            <div className="mt-5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 dark:text-neutral-500 mb-2">
                <span className="text-[10px] uppercase tracking-wider">Speed Rhythm Curve</span>
                <span className="text-[11px]">
                  Peak: <strong className="text-slate-800 dark:text-white font-bold">{sessionInsights.peakWpm} WPM</strong> • Avg: <strong className="text-slate-800 dark:text-white font-bold">{sessionInsights.avgWpm} WPM</strong> • Time: <strong className="text-slate-800 dark:text-white font-bold">{formatTime(results.timeElapsed)}</strong>
                </span>
              </div>
              <div className="w-full h-28 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sessionChartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="minimalWpmGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tickFormatter={v => `${v}s`} stroke={isLight ? '#cbd5e1' : '#334155'} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="speed" stroke={isLight ? '#cbd5e1' : '#334155'} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<SessionTooltip />} cursor={{ stroke: isLight ? '#94a3b8' : '#475569', strokeWidth: 1 }} />
                    <Area yAxisId="speed" type="monotone" dataKey="wpm" stroke="#10b981" strokeWidth={2} fill="url(#minimalWpmGlow)" />
                    <Line yAxisId="speed" type="monotone" dataKey="raw" stroke={isLight ? '#94a3b8' : '#64748b'} strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Targeted Focus Areas (Only rendered if user has errors) ── */}
      {(topMissedWords.length > 0 || topHardKeys.length > 0) ? (
        <section className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500">
              Needs Practice:
            </span>
            {topMissedWords.slice(0, 4).map(([word, count]) => (
              <span key={word} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                {word} <span className="opacity-60 text-[10px]">×{count}</span>
              </span>
            ))}
            {topHardKeys.slice(0, 4).map(([key, count]) => (
              <span key={key} className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold uppercase">
                [{key}] <span className="opacity-60 text-[10px]">×{count}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {topMissedWords.length > 0 && (
              <button
                onClick={() => onPractice('words')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30 transition-colors"
              >
                Drill Words →
              </button>
            )}
            {topHardKeys.length > 0 && (
              <button
                onClick={() => onPractice('keys')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/15 border border-rose-500/30 transition-colors"
              >
                Drill Keys →
              </button>
            )}
          </div>
        </section>
      ) : results.incorrectChars === 0 ? (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
          <span>✨</span>
          <span className="font-semibold">Flawless execution! 100% precision with zero typos recorded.</span>
        </div>
      ) : null}

      {/* ── 5. Clean, Collapsible Typed Passage Inspection (Zero Bloat) ── */}
      {(results.originalText || results.typedText) && (
        <section className="mt-4">
          <button
            type="button"
            onClick={() => setShowPassageReview(!showPassageReview)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-medium text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white bg-slate-100/70 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-colors flex items-center justify-between cursor-pointer"
          >
            <span>{showPassageReview ? '▲ Hide Typed Passage Review' : '▼ Inspect Typed Passage vs Original'}</span>
            <span className="text-[10px] text-slate-400">
              {results.typedText?.split(/\s+/).filter(Boolean).length || 0} words submitted
            </span>
          </button>

          {showPassageReview && fullComparisonData && (
            <div className="mt-2 p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-mono leading-relaxed max-h-64 overflow-y-auto animate-fade-in">
              <div className="flex items-center gap-3 pb-2 mb-3 border-b border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-neutral-400">
                <span>Legend:</span>
                <span className="text-slate-800 dark:text-neutral-200">Normal = Correct</span>
                <span className="text-rose-500 line-through">Red = Substitution</span>
                <span className="text-amber-500">[Amber] = Omission</span>
                <span className="text-blue-500">+Blue = Addition</span>
              </div>

              <div className="leading-loose select-text">
                {fullComparisonData.tokens.map((token, idx) => {
                  if (token.type === 'correct') {
                    return (
                      <span key={idx} className="text-slate-700 dark:text-neutral-300 mr-1.5">
                        {token.typed}
                      </span>
                    );
                  }
                  if (token.type === 'substitution') {
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-baseline mr-1.5 px-1 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-bold"
                        title={`Expected: "${token.expected}"`}
                      >
                        <span className="line-through opacity-60 mr-1">{token.expected}</span>
                        <span>{token.typed}</span>
                      </span>
                    );
                  }
                  if (token.type === 'omission') {
                    return (
                      <span
                        key={idx}
                        className="inline-flex mr-1.5 px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold"
                        title="Omitted word"
                      >
                        [{token.expected}]
                      </span>
                    );
                  }
                  if (token.type === 'addition') {
                    return (
                      <span
                        key={idx}
                        className="inline-flex mr-1.5 px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 font-bold"
                        title="Extra word"
                      >
                        +{token.typed}
                      </span>
                    );
                  }
                  return null;
                })}

                {fullComparisonData.unattemptedWords.length > 0 && (
                  <span className="text-slate-400 dark:text-neutral-600 italic">
                    ... ({fullComparisonData.unattemptedWords.length} words unattempted)
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 6. Primary Action Buttons ── */}
      <footer className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          {onNextLesson && nextLessonLabel ? (
            <button
              onClick={onNextLesson}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-105 text-white shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{nextLessonLabel}</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">Enter ↵</span>
            </button>
          ) : (
            <button
              onClick={onReset}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>↺ Retry Test</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">Tab ⇥</span>
            </button>
          )}

          {onNextLesson && nextLessonLabel && (
            <button
              onClick={onReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              <span>↺ Retry Drill</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCertificate(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            Claim Certificate 📜
          </button>

          <button
            onClick={() => setShowDiagnosticModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            Diagnostic Report 🖨️
          </button>

          <button
            onClick={onNewImage}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Return to Dashboard (Esc)"
          >
            Dashboard
          </button>
        </div>
      </footer>

      {/* Modals */}
      {showCertificate && (
        <CertificateModal results={results} onClose={() => setShowCertificate(false)} />
      )}

      {showDiagnosticModal && (
        <DiagnosticReportModal results={results} onClose={() => setShowDiagnosticModal(false)} />
      )}
    </div>
  );
};
