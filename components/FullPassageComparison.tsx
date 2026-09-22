import React, { useState, useMemo } from 'react';
import { FullComparisonData } from '../types';

interface FullPassageComparisonProps {
  comparisonData: FullComparisonData;
  initialExpanded?: boolean;
}

type ViewMode = 'sideBySide' | 'unified' | 'table';
type FilterType = 'all' | 'mistakes' | 'substitution' | 'omission' | 'addition';

export const FullPassageComparison: React.FC<FullPassageComparisonProps> = ({
  comparisonData,
  initialExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>('sideBySide');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    tokens,
    unattemptedWords,
    totalOriginalWords,
    totalTypedWords,
    correctCount,
    substitutionCount,
    omissionCount,
    additionCount,
    unattemptedCount,
  } = comparisonData;

  const totalMistakes = substitutionCount + omissionCount + additionCount;
  const attemptedWordsCount = correctCount + substitutionCount;
  const wordAccuracy =
    attemptedWordsCount + additionCount > 0
      ? ((correctCount / (attemptedWordsCount + additionCount)) * 100).toFixed(1)
      : '100.0';

  // Filtered tokens for display
  const filteredTokens = useMemo(() => {
    return tokens.filter(t => {
      // Filter by type
      if (activeFilter === 'mistakes' && t.type === 'correct') return false;
      if (activeFilter === 'substitution' && t.type !== 'substitution') return false;
      if (activeFilter === 'omission' && t.type !== 'omission') return false;
      if (activeFilter === 'addition' && t.type !== 'addition') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchExpected = t.expected?.toLowerCase().includes(q);
        const matchTyped = t.typed?.toLowerCase().includes(q);
        return matchExpected || matchTyped;
      }
      return true;
    });
  }, [tokens, activeFilter, searchQuery]);

  return (
    <div className="w-full bento-card p-4 md:p-6 mb-8 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121721] rounded-2xl shadow-sm transition-all animate-fade-in">
      {/* ── Header Bar with Summary & Hide/Show Toggle ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl">🔍</span>
            <h3 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Full Passage & Typing Comparison
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              Word-by-Word Diff
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Compare your typed response word-for-word against the master passage with instant error diagnostics.
          </p>
        </div>

        {/* Right Header Action: Hide/Show Toggle Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border cursor-pointer ${
              isExpanded
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 border-slate-300 dark:border-white/10'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm keep-white'
            }`}
            title={isExpanded ? 'Collapse this comparison section' : 'Expand full comparison section'}
          >
            <span>{isExpanded ? '▲ Hide Comparison' : '▼ Show Full Comparison'}</span>
          </button>
        </div>
      </div>

      {/* ── Summary Stat Pills (Always visible or compact) ── */}
      <div className="flex items-center gap-2 pt-3 flex-wrap text-xs font-mono">
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/5 font-semibold">
          Original: <strong className="text-slate-900 dark:text-white">{totalOriginalWords}</strong> words
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/5 font-semibold">
          Typed: <strong className="text-slate-900 dark:text-white">{totalTypedWords}</strong> words
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-semibold">
          ✅ Correct: <strong className="font-bold">{correctCount}</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-semibold">
          ❌ Substitutions: <strong className="font-bold">{substitutionCount}</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-semibold">
          ⚠️ Omissions: <strong className="font-bold">{omissionCount}</strong>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-semibold">
          ➕ Additions: <strong className="font-bold">{additionCount}</strong>
        </span>
        {unattemptedCount > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-white/5">
            ⏭️ Unattempted: <strong>{unattemptedCount}</strong>
          </span>
        )}
      </div>

      {/* ── Collapsible Body: Only rendered when isExpanded is true ── */}
      {isExpanded && (
        <div className="mt-5 space-y-4 animate-fade-in">
          {/* Controls: View Mode Tabs + Filter Pills + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-black/30 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('sideBySide')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'sideBySide'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs keep-white'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⚖️ Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'unified'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs keep-white'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>📄 Unified Diff</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs keep-white'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>📋 Errors Table</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all border whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-bold border-transparent'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                All Words
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('mistakes')}
                className={`px-2.5 py-1 rounded-lg transition-all border whitespace-nowrap ${
                  activeFilter === 'mistakes'
                    ? 'bg-rose-600 text-white font-bold border-rose-600 keep-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:border-rose-400'
                }`}
              >
                Mistakes Only ({totalMistakes})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('substitution')}
                className={`px-2.5 py-1 rounded-lg transition-all border whitespace-nowrap ${
                  activeFilter === 'substitution'
                    ? 'bg-rose-600 text-white font-bold border-rose-600 keep-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-white/10'
                }`}
              >
                Substitutions ({substitutionCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('omission')}
                className={`px-2.5 py-1 rounded-lg transition-all border whitespace-nowrap ${
                  activeFilter === 'omission'
                    ? 'bg-amber-600 text-white font-bold border-amber-600 keep-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-white/10'
                }`}
              >
                Omissions ({omissionCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('addition')}
                className={`px-2.5 py-1 rounded-lg transition-all border whitespace-nowrap ${
                  activeFilter === 'addition'
                    ? 'bg-blue-600 text-white font-bold border-blue-600 keep-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-white/10'
                }`}
              >
                Additions ({additionCount})
              </button>
            </div>

            {/* Word Search Filter */}
            <div className="relative min-w-[160px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search word..."
                className="w-full text-xs font-mono px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── MODE 1: Side-by-Side Dual View ── */}
          {viewMode === 'sideBySide' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Pane: Original Question Passage */}
              <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <span>📖</span>
                    <span>Original Question Passage</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {totalOriginalWords} words
                  </span>
                </div>
                <div
                  className="p-4 md:p-5 max-h-96 overflow-y-auto scrollbar-thin text-xs md:text-sm font-serif leading-relaxed text-slate-900 dark:text-neutral-100 select-text"
                  style={{ lineHeight: 1.85 }}
                >
                  <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                    {filteredTokens.map((token, idx) => {
                      if (token.type === 'addition') {
                        // Addition doesn't exist in original passage
                        return null;
                      }

                      if (token.type === 'correct') {
                        return (
                          <span
                            key={idx}
                            className="text-slate-900 dark:text-neutral-100 hover:bg-emerald-500/10 px-0.5 rounded transition-colors"
                            title={`Correct Word #${(token.origIndex ?? idx) + 1}`}
                          >
                            {token.expected}
                          </span>
                        );
                      }

                      if (token.type === 'substitution') {
                        return (
                          <span
                            key={idx}
                            className="bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 px-1 py-0.5 rounded border border-amber-300 dark:border-amber-500/40 font-semibold cursor-help"
                            title={`Substitution: You typed "${token.typed}" instead of "${token.expected}"`}
                          >
                            {token.expected}
                          </span>
                        );
                      }

                      if (token.type === 'omission') {
                        return (
                          <span
                            key={idx}
                            className="bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 px-1 py-0.5 rounded border border-rose-300 dark:border-rose-500/40 line-through decoration-rose-500 cursor-help"
                            title={`Omission: You skipped this word!`}
                          >
                            {token.expected}
                          </span>
                        );
                      }

                      return null;
                    })}

                    {/* Unattempted text at the end of original */}
                    {activeFilter === 'all' && unattemptedWords.length > 0 && (
                      <span className="text-slate-400 dark:text-neutral-500 italic">
                        {unattemptedWords.join(' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane: Candidate Typed Submission */}
              <div className="flex flex-col rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-black/20 overflow-hidden shadow-xs">
                <div className="px-4 py-2 bg-indigo-50/90 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <span>⌨️</span>
                    <span>Your Typed Submission</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {totalTypedWords} words typed
                  </span>
                </div>
                <div
                  className="p-4 md:p-5 max-h-96 overflow-y-auto scrollbar-thin text-xs md:text-sm font-serif leading-relaxed text-slate-900 dark:text-neutral-100 select-text"
                  style={{ lineHeight: 1.85 }}
                >
                  <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                    {filteredTokens.map((token, idx) => {
                      if (token.type === 'omission') {
                        // Candidate omitted this word, so it was never typed
                        return (
                          <span
                            key={idx}
                            className="bg-rose-100/60 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded border border-dashed border-rose-300 dark:border-rose-500/30 text-xs italic cursor-help"
                            title={`Omission: You skipped "${token.expected}"`}
                          >
                            [missing: {token.expected}]
                          </span>
                        );
                      }

                      if (token.type === 'correct') {
                        return (
                          <span
                            key={idx}
                            className="text-slate-900 dark:text-neutral-100 hover:bg-emerald-500/10 px-0.5 rounded transition-colors"
                          >
                            {token.typed}
                          </span>
                        );
                      }

                      if (token.type === 'substitution') {
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-500/40 font-semibold cursor-help"
                            title={`Substitution: You typed "${token.typed}" instead of "${token.expected}"`}
                          >
                            <span className="line-through text-rose-600 dark:text-rose-400">{token.typed}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              → {token.expected}
                            </span>
                          </span>
                        );
                      }

                      if (token.type === 'addition') {
                        return (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-500/40 font-semibold cursor-help"
                            title={`Addition: Extra word that was not present in the original passage!`}
                          >
                            +{token.typed}
                          </span>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MODE 2: Unified Diff Paragraph Flow ── */}
          {viewMode === 'unified' && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 overflow-hidden shadow-xs">
              <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-800 dark:text-neutral-200">
                  Unified Diagnostic Text Flow
                </span>
                <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                  Accuracy: {wordAccuracy}%
                </span>
              </div>
              <div
                className="p-5 max-h-96 overflow-y-auto scrollbar-thin text-xs md:text-sm font-serif leading-relaxed text-slate-900 dark:text-neutral-100 select-text"
                style={{ lineHeight: 2.1 }}
              >
                <div className="flex flex-wrap gap-x-2 gap-y-1.5">
                  {filteredTokens.map((token, idx) => {
                    if (token.type === 'correct') {
                      return (
                        <span key={idx} className="text-slate-900 dark:text-neutral-100">
                          {token.typed}
                        </span>
                      );
                    }

                    if (token.type === 'substitution') {
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 font-mono text-xs"
                        >
                          <span className="line-through text-rose-600 dark:text-rose-400">{token.typed}</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            → {token.expected}
                          </span>
                        </span>
                      );
                    }

                    if (token.type === 'omission') {
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-mono text-xs"
                        >
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 mr-1">
                            omitted:
                          </span>
                          <strong>{token.expected}</strong>
                        </span>
                      );
                    }

                    if (token.type === 'addition') {
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 font-mono text-xs"
                        >
                          <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mr-1">
                            extra:
                          </span>
                          <strong>{token.typed}</strong>
                        </span>
                      );
                    }

                    return null;
                  })}

                  {unattemptedWords.length > 0 && activeFilter === 'all' && (
                    <span className="text-slate-400 dark:text-neutral-500 italic">
                      [...unattempted: {unattemptedWords.slice(0, 30).join(' ')}
                      {unattemptedWords.length > 30 ? '...' : ''}]
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MODE 3: Structured Errors Table ── */}
          {viewMode === 'table' && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-96 scrollbar-thin">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300">
                      <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                      <th className="py-2.5 px-3 font-bold w-32">Mistake Type</th>
                      <th className="py-2.5 px-4 font-bold">Expected in Passage</th>
                      <th className="py-2.5 px-4 font-bold">What You Typed</th>
                      <th className="py-2.5 px-3 font-bold w-28 text-right">Deduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredTokens
                      .filter(t => t.type !== 'correct')
                      .map((m, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 dark:text-neutral-500 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                m.type === 'omission'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                  : m.type === 'substitution'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-emerald-700 dark:text-emerald-400 font-semibold">
                            {m.expected || <span className="text-slate-400 italic">(none)</span>}
                          </td>
                          <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-semibold">
                            {m.typed ? (
                              <span className="line-through">{m.typed}</span>
                            ) : (
                              <span className="text-slate-400 italic">(skipped)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-bold">
                            -1 word
                          </td>
                        </tr>
                      ))}

                    {filteredTokens.filter(t => t.type !== 'correct').length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-neutral-500">
                          🎉 Zero mistakes matching current filters! Clean typing!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Visual Legend Footer ── */}
          <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-slate-500 dark:text-neutral-400 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-neutral-300">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Correct</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Substitution (गलत शब्द)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>Omission (छूटा शब्द)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span>Addition (अतिरिक्त शब्द)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-neutral-600" />
              <span>Unattempted (शेष पाठ)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
