import React, { useState, useMemo } from 'react';
import { PRACTICE_LIBRARY } from '../data/practiceLibrary';
import { GameMode, HardcoreMode, PassageCategory, PracticePassage, TimeLimit } from '../types';

interface PracticeLibraryViewProps {
  onStartPassage: (passage: PracticePassage, mode: GameMode, timeLimit: TimeLimit, hardcore?: HardcoreMode) => void;
}

const CATEGORIES: { id: 'all' | PassageCategory; label: string }[] = [
  { id: 'all', label: 'All Passages' },
  { id: 'righthand', label: '✋ Right Hand Special (दायां हाथ)' },
  { id: 'collision', label: '🎯 Finger Collision Fix (उंगली भ्रम)' },
  { id: 'legal', label: 'Court & Legal' },
  { id: 'ssc', label: 'SSC Exam Passages' },
  { id: 'hindi', label: '🇮🇳 Hindi (हिंदी)' },
  { id: 'literature', label: 'Literature & Speeches' },
  { id: 'tech', label: 'Tech & Code' },
  { id: 'numbers', label: 'Numbers & Data Entry' },
];

export const PracticeLibraryView: React.FC<PracticeLibraryViewProps> = ({ onStartPassage }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PassageCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<TimeLimit>(0);
  const [isAccuracyFirst, setIsAccuracyFirst] = useState(false);

  const filteredPassages = useMemo(() => {
    return PRACTICE_LIBRARY.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getDifficultyBadge = (diff: PracticePassage['difficulty']) => {
    if (diff === 'Exam') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (diff === 'Hard') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (diff === 'Medium') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bento-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold">
              Built-in Passage Library
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
            Curated Typing Library
          </h2>
          <p className="text-neutral-400 text-sm mt-1 max-w-xl">
            Real court judgments, official SSC exam paragraphs, tech articles, and inspiring speeches ready to type.
          </p>
        </div>

        {/* Global Timer & Accuracy First Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAccuracyFirst(!isAccuracyFirst)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
              isAccuracyFirst
                ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
            }`}
            title="Block Backspace to test real exam muscle memory"
          >
            <span>🛡️</span>
            <span>{isAccuracyFirst ? 'No Backspace ON' : 'Standard (⌫ On)'}</span>
          </button>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl">
            <span className="text-xs font-mono text-neutral-400 pl-2 pr-1">Timer:</span>
            {([0, 60, 120, 300, 600] as TimeLimit[]).map(t => (
              <button
                key={t}
                onClick={() => setSelectedTimeLimit(t)}
                className={`text-xs font-mono px-3 py-1 rounded-xl font-bold transition-all ${
                  selectedTimeLimit === t
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t === 0 ? 'Full' : `${t / 60}m`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map(cat => {
            const count = cat.id === 'all' 
              ? PRACTICE_LIBRARY.length 
              : PRACTICE_LIBRARY.filter(p => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border-white/5'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-black/10 text-black font-bold' : 'bg-white/10 text-neutral-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative shrink-0 sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passages..."
            className="w-full bg-neutral-900/80 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Passages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPassages.map(passage => (
          <div
            key={passage.id}
            className="bento-card p-5 md:p-6 rounded-3xl bg-neutral-950/70 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDifficultyBadge(passage.difficulty)}`}>
                  {passage.difficulty}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {passage.wordCount} words • ~{passage.estimatedMinutes} min
                </span>
              </div>

              <h4 className="text-base font-bold text-white tracking-tight">{passage.title}</h4>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{passage.description}</p>

              <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/5 font-mono text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                "{passage.text}"
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="flex gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => onStartPassage(passage, 'DIGITAL', selectedTimeLimit, isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(255,255,255,0.2)] flex items-center justify-center gap-1.5 ${
                  isAccuracyFirst
                    ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                <span>{isAccuracyFirst ? 'Digital (No ⌫)' : 'Digital Mode'}</span>
              </button>
              <button
                onClick={() => onStartPassage(passage, 'PHYSICAL', selectedTimeLimit, isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE')}
                className="py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                title="Type in Split Paper / Exam Mode"
              >
                <span>Paper Mode</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
