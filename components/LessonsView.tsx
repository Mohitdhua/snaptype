import React, { useMemo, useState } from 'react';
import { LESSONS, MASTERY_PLAN, DayPlan } from '../data/lessonsData';
import { PRACTICE_LIBRARY } from '../data/practiceLibrary';
import { Lesson, LessonProgress, LessonProgressMap, FingerId, PracticePassage } from '../types';
import {
  getLessonProgress,
  getAdaptiveProfile,
  generateWeaknessDrill,
  generateCollisionRepairDrill,
  isLessonUnlocked,
  getDayProgress
} from '../services/storageService';

interface LessonsViewProps {
  progress?: LessonProgressMap;
  onSelectExercise: (text: string, lessonId: string, title: string) => void;
}

const FINGER_META: Record<FingerId, { label: string; hand: 'Left' | 'Right' | 'Thumb'; defaultKeys: string }> = {
  lp: { label: 'Left Pinky', hand: 'Left', defaultKeys: 'Q, A, Z, 1' },
  lr: { label: 'Left Ring', hand: 'Left', defaultKeys: 'W, S, X, 2' },
  lm: { label: 'Left Middle', hand: 'Left', defaultKeys: 'E, D, C, 3' },
  li: { label: 'Left Index', hand: 'Left', defaultKeys: 'R, T, F, G, V, B' },
  thumb: { label: 'Space Thumb', hand: 'Thumb', defaultKeys: 'Space' },
  ri: { label: 'Right Index', hand: 'Right', defaultKeys: 'Y, U, H, J, N, M' },
  rm: { label: 'Right Middle', hand: 'Right', defaultKeys: 'I, K, Comma' },
  rr: { label: 'Right Ring', hand: 'Right', defaultKeys: 'O, L, Period' },
  rp: { label: 'Right Pinky', hand: 'Right', defaultKeys: 'P, ;, /, 0, -' },
};

const ORDERED_FINGERS: FingerId[] = ['lp', 'lr', 'lm', 'li', 'thumb', 'ri', 'rm', 'rr', 'rp'];

export const LessonsView: React.FC<LessonsViewProps> = ({ progress: propProgress, onSelectExercise }) => {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [activeLesson, setActiveLesson] = useState<Lesson>(LESSONS[0]);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'roadmap' | 'weakness' | 'collision'>('curriculum');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  const progress: LessonProgressMap = propProgress || getLessonProgress();
  const adaptiveProfile = useMemo(() => getAdaptiveProfile(), []);
  const dayProgress = useMemo(() => getDayProgress(), []);

  const stages = [
    { num: 1, title: 'Home Row', desc: 'ASDF JKL;' },
    { num: 2, title: 'Top Row', desc: 'QWERTY UIOP' },
    { num: 3, title: 'Bottom Row', desc: 'ZXCVB NM,./' },
    { num: 4, title: 'Shift & Caps', desc: 'Capitalization' },
    { num: 5, title: 'Number Row', desc: '12345 67890' },
    { num: 6, title: 'Speed Booster', desc: 'Top 100 Words' },
  ];

  const collisionPassages = useMemo(() => {
    return PRACTICE_LIBRARY.filter(p => p.category === 'collision');
  }, []);

  const stageLessons = useMemo(() => {
    if (selectedDayNumber !== null) {
      const dayPlan = MASTERY_PLAN.find(d => d.day === selectedDayNumber);
      if (dayPlan) {
        return LESSONS.filter(l => dayPlan.lessonIds.includes(l.id));
      }
    }
    return LESSONS.filter(l => l.stage === selectedStage);
  }, [selectedStage, selectedDayNumber]);

  // Overall stats
  const totalLessons = LESSONS.length;
  const completedLessons = Object.values(progress).filter((p: LessonProgress) => p && p.completed).length;
  const overallPercentage = Math.round((completedLessons / totalLessons) * 100);

  // Recommended next lesson
  const recommendedLesson = useMemo(() => {
    if (adaptiveProfile.recommendedLessonId) {
      return LESSONS.find(l => l.id === adaptiveProfile.recommendedLessonId) || LESSONS[0];
    }
    return LESSONS[0];
  }, [adaptiveProfile.recommendedLessonId]);

  const handleStartWeaknessDrill = () => {
    let drillText = generateWeaknessDrill(adaptiveProfile);
    if (!drillText || drillText.trim().length < 50) {
      drillText = 'the quick brown fox jumps over the lazy dog package text view size clear make user calm quick judge form stream index equal power daily test speed focus rhythm hand accuracy master clerk typing flow target world number';
    }
    onSelectExercise(drillText, 'adaptive-weakness', 'AI Adaptive Finger & Weak Key Drill');
  };

  const handleStartCollisionDrill = (focusPair?: string) => {
    const drillText = generateCollisionRepairDrill(adaptiveProfile, focusPair);
    const label = focusPair ? `Finger Isolation Drill (${focusPair.toUpperCase()})` : 'AI Adaptive Collision Disentangler';
    onSelectExercise(drillText, `collision-${focusPair || 'ai-auto'}`, label);
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-0.5 text-xs text-amber-400">
        {[1, 2, 3].map(s => (
          <span key={s} className={s <= stars ? 'opacity-100 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'opacity-20'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* Top Header Banner */}
      <div className="bento-card p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Typing Master AI Academy
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              0 → 40+ WPM in 10 Days
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Finger Biomechanics & Touch Typing Curriculum
          </h2>
          <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl leading-relaxed">
            Progressive blind typing drills calibrated for Indian competitive exams (SSC, High Court, Clerk) with real-time finger error tracking.
          </p>
        </div>

        {/* Course Progress & Day Stat */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-6 text-xs text-neutral-400 font-mono">
              <span>Academy Progress</span>
              <span className="text-white font-bold">{completedLessons} / {totalLessons} Lessons</span>
            </div>
            <div className="w-full sm:w-56 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono">
            <div className="flex items-center gap-2 text-indigo-300">
              <span className="text-base">📅</span>
              <span>Day {dayProgress.currentDay} Target</span>
            </div>
            <span className="font-bold text-white bg-indigo-500/30 px-2 py-0.5 rounded-md">
              {MASTERY_PLAN[dayProgress.currentDay - 1]?.targetWpm || 40} WPM Goal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTab('curriculum'); setSelectedDayNumber(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'curriculum'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <span>📚 Stage Curriculum</span>
            <span className="text-[10px] opacity-70">({LESSONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'roadmap'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🎯 10-Day Mastery Plan</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 text-[10px]">Bootcamp</span>
          </button>

          <button
            onClick={() => setActiveTab('collision')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'collision'
                ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20'
                : 'bg-neutral-900/80 text-cyan-300 hover:text-white border border-cyan-500/20'
            }`}
          >
            <span>⚡ Finger Collision Fix (उंगली भ्रम)</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-900 font-black text-[9px]">HOT</span>
          </button>

          <button
            onClick={() => setActiveTab('weakness')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'weakness'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🦾 Finger Radar</span>
            {adaptiveProfile.weakestKeys.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Quick Launch Targeted Weakness Drill */}
        <button
          onClick={handleStartWeaknessDrill}
          className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          <span>⚡ AI Weakness Drill</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>

      {/* ================= 10-DAY ROADMAP VIEW ================= */}
      {activeTab === 'roadmap' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="bento-card p-6 bg-neutral-950/70 border border-white/10 rounded-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🚀 10-Day Touch Typing Speed Blueprint</span>
                </h3>
                <p className="text-neutral-400 text-xs mt-1">
                  Follow this daily structured training regimen. Complete minimum sessions each day to lock in finger muscle memory.
                </p>
              </div>
              <div className="text-xs font-mono text-neutral-400">
                Current: <span className="text-indigo-400 font-bold">Day {dayProgress.currentDay} / 10</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {MASTERY_PLAN.map(dp => {
                const isCurrent = dp.day === dayProgress.currentDay;
                const isPast = dp.day < dayProgress.currentDay;
                const isSelected = selectedDayNumber === dp.day;

                // Check completion of this day's lessons
                const dayLessons = LESSONS.filter(l => dp.lessonIds.includes(l.id));
                const completedCount = dayLessons.filter(l => progress[l.id]?.completed).length;
                const isAllDone = completedCount === dayLessons.length && dayLessons.length > 0;

                return (
                  <div
                    key={dp.day}
                    onClick={() => {
                      setSelectedDayNumber(dp.day);
                      const firstLesson = LESSONS.find(l => dp.lessonIds.includes(l.id));
                      if (firstLesson) setActiveLesson(firstLesson);
                      setActiveTab('curriculum');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-400 shadow-lg shadow-indigo-500/20'
                        : isCurrent
                          ? 'bg-neutral-900/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                          : isPast
                            ? 'bg-neutral-950/60 border-white/10 hover:border-white/20'
                            : 'bg-neutral-950/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isCurrent ? 'bg-amber-400 text-black' : isPast ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-neutral-400'
                        }`}>
                          Day {dp.day}
                        </span>
                        {isAllDone ? (
                          <span className="text-emerald-400 text-xs">✓ Done</span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-400">{completedCount}/{dayLessons.length}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2 leading-tight">{dp.title}</h4>
                      <p className="text-[11px] font-mono text-indigo-300 mt-1">Target: {dp.targetWpm} WPM</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{dp.minSessions} Sessions</span>
                      <span className="text-indigo-400 hover:underline">View Drills →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= FINGER COLLISION & NEIGHBOR DISCRIMINATOR VIEW ================= */}
      {activeTab === 'collision' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Main Collision Diagnostic Bento */}
          <div className="bento-card p-6 md:p-8 bg-gradient-to-br from-neutral-950 via-cyan-950/20 to-neutral-950 border border-cyan-500/30 rounded-3xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 font-bold">
                    Biomechanical Neuro-Muscular Calibration
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                    Same-Finger Reach & Neighbor Tendon Disentangler
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Adjacent Finger Confusion & Reach Mastery Mode
                </h3>
                <p className="text-neutral-400 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed">
                  Eliminates <strong className="text-cyan-300">Intra-Finger Reach Errors</strong> (Index & Pinky overshooting across 6-8 keys) and <strong className="text-cyan-300">Neighbor Tendon Interference</strong> (Ring & Middle fingers accidentally co-firing due to linked extensor tendons).
                </p>
              </div>

              <button
                onClick={() => handleStartCollisionDrill()}
                className="px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-2 shrink-0 font-mono"
              >
                <span>🚀 Launch AI Disentangler Drill</span>
                <span>→</span>
              </button>
            </div>

            {/* Diagnostic Collision Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-400">Total Analyzed Mistypes</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {adaptiveProfile.collisionStats?.totalErrors || 0}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 font-mono">Keystroke position audits</span>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold text-cyan-300">Same-Finger Reach Errors</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {adaptiveProfile.collisionStats?.sameFingerRatio || 0}%
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-cyan-200 mt-1">
                  {adaptiveProfile.collisionStats?.sameFingerErrors || 0} <span className="text-xs font-normal text-cyan-400">misreaches</span>
                </div>
                <span className="text-[10px] text-cyan-400/70 mt-1 font-mono">e.g. Index R↔T, F↔G, V↔B</span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-300">Neighbor Finger Crosstalk</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {adaptiveProfile.collisionStats?.neighborRatio || 0}%
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-200 mt-1">
                  {adaptiveProfile.collisionStats?.neighborErrors || 0} <span className="text-xs font-normal text-indigo-400">collisions</span>
                </div>
                <span className="text-[10px] text-indigo-400/70 mt-1 font-mono">e.g. Ring vs Middle W↔E, S↔D</span>
              </div>
            </div>

            {/* Active Conflict Pairs Hotlist */}
            <div className="mb-8 p-5 rounded-2xl bg-neutral-900/80 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span>⚡ Active Biomechanical Conflict Pairs</span>
                  <span className="text-[10px] text-neutral-500 font-normal">(Click any chip to practice that exact pair)</span>
                </span>
              </div>

              {adaptiveProfile.collisionStats?.topConflicts && adaptiveProfile.collisionStats.topConflicts.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {adaptiveProfile.collisionStats.topConflicts.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStartCollisionDrill(`${c.expected}-${c.typed}`)}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-2.5 transition-all text-left group"
                    >
                      <span className="font-mono font-black text-cyan-300 text-sm uppercase group-hover:text-white">
                        {c.expected} ↔ {c.typed}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 font-bold">
                        {c.count} misclicks
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 group-hover:text-cyan-300">
                        {c.type === 'SAME_FINGER_REACH' ? 'Reach' : 'Neighbor'} →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {['r-t', 'f-g', 'v-b', 'w-e', 's-d', 'u-y', 'i-o', 'k-l'].map(pair => (
                    <button
                      key={pair}
                      onClick={() => handleStartCollisionDrill(pair)}
                      className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 flex items-center gap-2 text-xs font-mono text-neutral-300 hover:text-white transition-all"
                    >
                      <span className="font-bold uppercase text-cyan-400">{pair.toUpperCase()}</span>
                      <span>Disentangle →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6 Curated Biomechanical Isolation Passages Grid */}
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-300 mb-4 flex items-center gap-2">
              <span>🎯 6 Master Finger Decoupling & Isolation Passages</span>
              <span className="text-xs text-neutral-500 font-normal">(1,000–1,500+ Chars per session)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collisionPassages.map(p => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {p.difficulty}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        ~{p.wordCount} Words
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {p.title}
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectExercise(p.text, p.id, p.title)}
                    className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-cyan-400 hover:text-black text-white transition-all flex items-center justify-center gap-2 font-mono"
                  >
                    <span>Start Isolation Drill</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= FINGER BIOMECHANICS & RADAR VIEW ================= */}
      {activeTab === 'weakness' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="bento-card p-6 md:p-8 bg-neutral-950/80 border border-white/10 rounded-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🦾</span>
                  <h3 className="text-xl font-bold text-white">Finger Accuracy & Biomechanical Analysis</h3>
                </div>
                <p className="text-neutral-400 text-xs max-w-xl">
                  SnapType monitors individual finger impact velocity, misclicks, and anchor drift. Weaker fingers receive higher drill weight.
                </p>
              </div>

              <button
                onClick={handleStartWeaknessDrill}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Launch Targeted Repair Drill</span>
                <span>→</span>
              </button>
            </div>

            {/* Error-Prone Keys Highlight Chips */}
            <div className="mb-6 p-4 rounded-2xl bg-neutral-900/60 border border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Top Error-Prone Letters & Hard Keys
              </span>
              {adaptiveProfile.weakestKeys.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {adaptiveProfile.weakestKeys.map(k => {
                    const stats = adaptiveProfile.keyStats[k];
                    const errRate = stats ? Math.round(stats.lastErrorRate * 100) : 0;
                    return (
                      <div
                        key={k}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2"
                      >
                        <span className="font-mono font-bold text-white text-sm uppercase">
                          {k === ' ' ? 'Space' : k}
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 font-semibold">
                          {errRate}% error
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 text-xs italic">
                  Complete 2-3 drills to let the AI calibrate your per-finger error frequency.
                </p>
              )}
            </div>

            {/* 9-Finger Accuracy Bars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ORDERED_FINGERS.map(fingerId => {
                const meta = FINGER_META[fingerId];
                const stats = adaptiveProfile.fingerStats[fingerId];
                const attempts = stats?.totalAttempts || 0;
                const errors = stats?.totalErrors || 0;
                const accuracy = attempts > 0 ? Math.max(0, Math.round(((attempts - errors) / attempts) * 100)) : 100;

                const isWeak = adaptiveProfile.weakestFingers.includes(fingerId);
                const colorClass =
                  accuracy >= 95
                    ? 'bg-emerald-400'
                    : accuracy >= 85
                      ? 'bg-amber-400'
                      : 'bg-rose-400';

                return (
                  <div
                    key={fingerId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWeak
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                        : 'bg-neutral-900/40 border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{meta.label}</span>
                          {isWeak && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                              Needs Drill
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">{meta.defaultKeys}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-white">{accuracy}%</span>
                        <div className="text-[9px] font-mono text-neutral-400">{attempts} hits</div>
                      </div>
                    </div>

                    {/* Accuracy Bar */}
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${colorClass} transition-all duration-300 rounded-full`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>

                    {/* Weakest keys for this finger */}
                    {stats?.weakKeys && stats.weakKeys.length > 0 && (
                      <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 mt-1">
                        <span>Frequent errors:</span>
                        <span className="text-rose-300 font-bold uppercase">{stats.weakKeys.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= CURRICULUM VIEW ================= */}
      {activeTab === 'curriculum' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Smart Recommendation Banner if available */}
          {recommendedLesson && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-neutral-900 border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  🎯
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                    Recommended Next Mastery Step
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {recommendedLesson.stageTitle} — {recommendedLesson.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveLesson(recommendedLesson);
                  setSelectedStage(recommendedLesson.stage);
                  setSelectedDayNumber(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500 hover:bg-indigo-400 text-white transition-all shrink-0"
              >
                Jump to Lesson →
              </button>
            </div>
          )}

          {/* Stage Selector Pills (if not filtering by day) */}
          {selectedDayNumber === null ? (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {stages.map(st => {
                const isSelected = selectedStage === st.num;
                const stageLessonList = LESSONS.filter(l => l.stage === st.num);
                const stageDone = stageLessonList.filter(l => progress[l.id]?.completed).length;

                return (
                  <button
                    key={st.num}
                    onClick={() => {
                      setSelectedStage(st.num);
                      const firstInStage = LESSONS.find(l => l.stage === st.num);
                      if (firstInStage) setActiveLesson(firstInStage);
                    }}
                    className={`px-4 py-3 rounded-2xl flex flex-col text-left shrink-0 transition-all border ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-neutral-600' : 'text-neutral-500'}`}>
                        Stage {st.num}
                      </span>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        {stageDone}/{stageLessonList.length}
                      </span>
                    </div>
                    <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-black' : 'text-neutral-200'}`}>
                      {st.title}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
              <span className="text-xs font-mono text-indigo-300 font-bold">
                Filtering by Day {selectedDayNumber}: {MASTERY_PLAN.find(d => d.day === selectedDayNumber)?.title}
              </span>
              <button
                onClick={() => setSelectedDayNumber(null)}
                className="text-xs font-mono text-neutral-400 hover:text-white underline"
              >
                Show All Stages
              </button>
            </div>
          )}

          {/* Main Grid: Lessons List + Active Lesson Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Stage Lessons List */}
            <div className="flex flex-col gap-3">
              {stageLessons.map(lesson => {
                const isSelected = activeLesson.id === lesson.id;
                const p = progress[lesson.id];
                const isDone = p?.completed;
                const unlocked = isLessonUnlocked(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-900/90 border-indigo-500/60 shadow-lg'
                        : 'bg-neutral-950/60 hover:bg-neutral-900/60 border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                        {lesson.targetKeys.slice(0, 5).join('  ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!unlocked && (
                          <span className="text-[10px] font-mono text-amber-400/80">🔒</span>
                        )}
                        {isDone ? renderStars(p.stars || 1) : <span className="text-[10px] font-mono text-neutral-500">Pending</span>}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{lesson.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{lesson.description}</p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-neutral-400">
                      <span>Target: {lesson.minWpm} WPM</span>
                      <span>{lesson.exercises.length} Exercises</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right 2 Columns: Active Lesson Interactive Panel */}
            <div className="md:col-span-2 bento-card p-6 md:p-8 flex flex-col justify-between gap-6 bg-neutral-950/80 border border-white/10 rounded-3xl">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">
                      {activeLesson.stageTitle}
                    </span>
                    <h3 className="text-2xl font-bold text-white mt-1">{activeLesson.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-neutral-500">Grading Target</div>
                      <div className="text-sm font-mono font-bold text-neutral-300">
                        {activeLesson.minWpm} WPM / {activeLesson.minAccuracy}% Acc
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-neutral-300 text-sm leading-relaxed mb-6">{activeLesson.description}</p>

                {/* Target Keys Tags */}
                <div className="mb-6">
                  <span className="text-xs uppercase font-bold tracking-wider text-neutral-400 block mb-2">
                    Keycap Focus Area
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeLesson.targetKeys.map(k => (
                      <span
                        key={k}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-white font-mono text-xs font-bold shadow-sm"
                      >
                        {k === ' ' ? 'Space' : k.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Exercises in this lesson */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                      Lesson Exercises & Deep Drills
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {activeLesson.exercises.length} Progressive Drills (~350–450 chars each)
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {activeLesson.exercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-bold uppercase">
                              {ex.type} • Part {idx + 1}
                            </span>
                            <h5 className="text-sm font-bold text-white truncate">{ex.title}</h5>
                            <span className="text-[10px] font-mono text-neutral-400">
                              ({ex.text.length} chars)
                            </span>
                          </div>
                          <p className="text-xs font-mono text-neutral-400 truncate mt-1.5">"{ex.text}"</p>
                        </div>

                        <button
                          onClick={() => onSelectExercise(ex.text, activeLesson.id, `${activeLesson.title} - ${ex.title}`)}
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        >
                          <span>Start Drill</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
