import React, { useMemo, useState, useEffect } from 'react';
import { LESSONS, MASTERY_PLAN, getNextLessonTarget } from '../data/lessonsData';
import { PRACTICE_LIBRARY } from '../data/practiceLibrary';
import { Lesson, LessonProgress, LessonProgressMap, FingerId, HardcoreMode } from '../types';
import {
  getLessonProgress,
  getAdaptiveProfile,
  generateWeaknessDrill,
  generateCollisionRepairDrill,
  isLessonUnlocked,
  getDayProgress,
  getLastActiveLessonId,
  setLastActiveLessonId
} from '../services/storageService';

interface LessonsViewProps {
  progress?: LessonProgressMap;
  onSelectExercise: (text: string, lessonId: string, title: string, hardcoreMode?: HardcoreMode, exerciseIndex?: number) => void;
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
  const progress: LessonProgressMap = propProgress || getLessonProgress();
  const adaptiveProfile = useMemo(() => getAdaptiveProfile(), []);
  const dayProgress = useMemo(() => getDayProgress(), []);

  // Determine user's current active lesson based on history & uncompleted lessons
  const currentActiveLesson = useMemo(() => {
    const lastActiveId = getLastActiveLessonId();
    if (lastActiveId) {
      const lastLesson = LESSONS.find(l => l.id === lastActiveId);
      if (lastLesson) {
        if (!progress[lastLesson.id]?.completed) {
          return lastLesson;
        }
        const nextTarget = getNextLessonTarget(lastLesson.id, (lastLesson.exercises.length || 1) - 1);
        if (nextTarget) {
          const nextLesson = LESSONS.find(l => l.id === nextTarget.lessonId);
          if (nextLesson) return nextLesson;
        }
      }
    }
    const firstUncompleted = LESSONS.find(l => !progress[l.id]?.completed);
    return firstUncompleted || LESSONS[0];
  }, [progress]);

  const [selectedStage, setSelectedStage] = useState<number>(() => currentActiveLesson.stage);
  const [activeLesson, setActiveLesson] = useState<Lesson>(() => currentActiveLesson);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'hands' | 'fingers' | 'caps' | 'roadmap' | 'weakness' | 'collision'>('curriculum');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [isAccuracyFirst, setIsAccuracyFirst] = useState(false);

  useEffect(() => {
    setSelectedStage(currentActiveLesson.stage);
    setActiveLesson(currentActiveLesson);
  }, [currentActiveLesson.id]);

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

  const handleStartWeaknessDrill = (forceNoBackspace: boolean = false) => {
    let drillText = generateWeaknessDrill(adaptiveProfile);
    if (!drillText || drillText.trim().length < 50) {
      drillText = 'the quick brown fox jumps over the lazy dog package text view size clear make user calm quick judge form stream index equal power daily test speed focus rhythm hand accuracy master clerk typing flow target world number';
    }
    const mode: HardcoreMode = forceNoBackspace || isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE';
    onSelectExercise(drillText, 'adaptive-weakness', 'AI Adaptive Finger & Weak Key Drill', mode);
  };

  const handleStartCollisionDrill = (focusPair?: string, forceNoBackspace: boolean = false) => {
    const drillText = generateCollisionRepairDrill(adaptiveProfile, focusPair);
    const label = focusPair ? `Finger Isolation Drill (${focusPair.toUpperCase()})` : 'AI Adaptive Collision Disentangler';
    const mode: HardcoreMode = forceNoBackspace || isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE';
    onSelectExercise(drillText, `collision-${focusPair || 'ai-auto'}`, label, mode);
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-0.5 text-xs text-amber-400">
        {[1, 2, 3].map(s => (
          <span key={s} className={s <= stars ? 'opacity-100' : 'opacity-20'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* 1. Ultra-Clean, Non-Boxy Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                Touch Typing Academy
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">SSC & High Court Exam Calibrated</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Finger Biomechanics & Touch Typing
            </h2>
          </div>

          {/* Minimal Progress Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono">
            <span className="text-slate-500 dark:text-neutral-400">Progress:</span>
            <span className="font-bold text-slate-900 dark:text-white">{completedLessons}/{totalLessons} ({overallPercentage}%)</span>
            <div className="w-20 sm:w-28 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Unified Hero Card: Current Lesson & Integrated Controls */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-black shrink-0">
              {currentActiveLesson.stage}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50 uppercase tracking-wider">
                  Current Lesson
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Stage {currentActiveLesson.stage}: {currentActiveLesson.stageTitle}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {currentActiveLesson.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Keys: <strong className="text-slate-800 dark:text-slate-200 font-mono">{currentActiveLesson.targetKeys.join(', ')}</strong></span>
                <span>•</span>
                <span>Goal: {currentActiveLesson.minWpm} WPM ({currentActiveLesson.minAccuracy}% Acc)</span>
                {progress[currentActiveLesson.id]?.completed && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Completed ({progress[currentActiveLesson.id]?.stars || 1}★)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Integrated Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Accuracy-first (no backspace) toggle */}
            <button
              onClick={() => setIsAccuracyFirst(!isAccuracyFirst)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
                isAccuracyFirst
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
              }`}
              title="Disable Backspace to enforce real muscle memory"
            >
              <span>🛡️</span>
              <span>{isAccuracyFirst ? 'No Backspace ON' : 'No Backspace'}</span>
            </button>

            {/* Right-Hand Focus Mode */}
            <button
              onClick={() => onSelectExercise(
                'j k l ; u i o p h n m , . / ;lkj poiu juki lopi look loop pool kill silk milk pink jolly monk look milk hill pulp jump onion join loop moon plum hook junk hymn holy oily lion coin foil join look like link pool loop plum pink punk jump monk milk hull lull kill look jolly puppy imply oily pony lion. Looking upon moist soil in July, millions of lively monks imply pure joy. Jolly monks look like joyful souls jumping into oily pools of milk.',
                'rh-special',
                '✋ Right Hand Special Mode Drill',
                'RIGHT_HAND_FOCUS'
              )}
              className="px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5"
              title="Starts dedicated Right Hand Focus practice"
            >
              <span>✋</span>
              <span>Right Hand</span>
            </button>

            {/* Primary Continue Button */}
            <button
              onClick={() => {
                setSelectedStage(currentActiveLesson.stage);
                setActiveLesson(currentActiveLesson);
                setLastActiveLessonId(currentActiveLesson.id);
                const firstEx = currentActiveLesson.exercises[0];
                if (firstEx) {
                  onSelectExercise(
                    firstEx.text,
                    currentActiveLesson.id,
                    `${currentActiveLesson.title} - ${firstEx.title}`,
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE',
                    0
                  );
                }
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm flex items-center gap-2 font-mono keep-white"
            >
              <span>{isAccuracyFirst ? 'Continue (No ⌫)' : 'Continue Lesson'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Unified Navigation Bar: Stages & Views */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
        {/* Stage & View Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {stages.map(st => {
            const isSelected = activeTab === 'curriculum' && selectedStage === st.num && selectedDayNumber === null;
            const stageLessonList = LESSONS.filter(l => l.stage === st.num);
            const stageDone = stageLessonList.filter(l => progress[l.id]?.completed).length;

            return (
              <button
                key={st.num}
                onClick={() => {
                  setActiveTab('curriculum');
                  setSelectedDayNumber(null);
                  setSelectedStage(st.num);
                  const firstInStage = LESSONS.find(l => l.stage === st.num);
                  if (firstInStage) setActiveLesson(firstInStage);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                    : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
                }`}
              >
                <span>{st.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-white/20 text-white keep-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-neutral-400'
                }`}>
                  {stageDone}/{stageLessonList.length}
                </span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 shrink-0" />

          {/* Mode Tabs */}
          <button
            onClick={() => { setActiveTab('hands'); setSelectedDayNumber(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'hands'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
            }`}
          >
            ✋ Hand Isolation
          </button>

          <button
            onClick={() => { setActiveTab('fingers'); setSelectedDayNumber(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'fingers'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
            }`}
          >
            🖐️ Per-Finger Lab
          </button>

          <button
            onClick={() => { setActiveTab('caps'); setSelectedDayNumber(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'caps'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
            }`}
          >
            🔠 Caps & Shift
          </button>

          <button
            onClick={() => { setActiveTab('roadmap'); setSelectedDayNumber(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'roadmap'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
            }`}
          >
            10-Day Plan
          </button>

          <button
            onClick={() => { setActiveTab('collision'); setSelectedDayNumber(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'collision'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
            }`}
          >
            Finger Decoupling
          </button>

          <button
            onClick={() => { setActiveTab('weakness'); setSelectedDayNumber(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === 'weakness'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                : 'bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10'
            }`}
          >
            Weakness Radar
          </button>
        </div>

        {/* Quick Launch AI Weakness Drill */}
        <button
          onClick={() => handleStartWeaknessDrill(isAccuracyFirst)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>⚡ AI Drill</span>
          <span className="text-[10px]">→</span>
        </button>
      </div>

      {/* ================= CURRICULUM VIEW ================= */}
      {activeTab === 'curriculum' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {selectedDayNumber !== null && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 text-xs shadow-sm">
              <span className="text-slate-700 dark:text-neutral-300 font-mono">
                Showing drills for <strong className="text-indigo-600 dark:text-indigo-400">Day {selectedDayNumber}: {MASTERY_PLAN.find(d => d.day === selectedDayNumber)?.title}</strong>
              </span>
              <button
                onClick={() => setSelectedDayNumber(null)}
                className="font-mono text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white underline text-[11px]"
              >
                Show All Stages
              </button>
            </div>
          )}

          {/* Main Grid: Lessons List + Active Lesson Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: Stage Lessons List */}
            <div className="flex flex-col gap-2.5">
              {stageLessons.map(lesson => {
                const isSelected = activeLesson.id === lesson.id;
                const isCurrent = currentActiveLesson.id === lesson.id;
                const p = progress[lesson.id];
                const isDone = p?.completed;
                const unlocked = isLessonUnlocked(lesson.id);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => {
                      setActiveLesson(lesson);
                      setLastActiveLessonId(lesson.id);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                        : isCurrent
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-white/5'
                        : 'bg-white dark:bg-[#141a24] hover:bg-slate-50 dark:hover:bg-white/5 border-slate-200 dark:border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 text-[9px] font-mono font-bold">
                            CURRENT
                          </span>
                        )}
                        {lesson.targetKeys.slice(0, 4).map(k => (
                          <span key={k} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-700 dark:text-neutral-300 font-bold uppercase">
                            {k === ' ' ? 'Space' : k}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!unlocked && <span className="text-[10px] text-amber-500">🔒</span>}
                        {isDone ? renderStars(p.stars || 1) : <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">Pending</span>}
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{lesson.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">{lesson.description}</p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      <span>Target: {lesson.minWpm} WPM</span>
                      <span>{lesson.exercises.length} Drills</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right 2 Columns: Active Lesson Interactive Panel */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between gap-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold">
                      {activeLesson.stageTitle}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{activeLesson.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 font-semibold">
                      {activeLesson.minWpm} WPM • {activeLesson.minAccuracy}% Acc
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-neutral-300 text-xs leading-relaxed mb-4">{activeLesson.description}</p>

                {/* Target Keys Tags */}
                <div className="mb-5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-400 block mb-1.5">
                    Target Keycaps
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeLesson.targetKeys.map(k => (
                      <span
                        key={k}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-mono text-xs font-bold"
                      >
                        {k === ' ' ? 'Space' : k.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Exercises in this lesson */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-neutral-400">
                      Lesson Drills & Exercises
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      {activeLesson.exercises.length} Drills (~350–500 chars each)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {activeLesson.exercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-neutral-300 font-bold uppercase">
                              {ex.type} • Part {idx + 1}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{ex.title}</h5>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                              ({ex.text.length} chars)
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 truncate mt-1">"{ex.text}"</p>
                        </div>

                        <button
                          onClick={() => {
                            setLastActiveLessonId(activeLesson.id);
                            onSelectExercise(ex.text, activeLesson.id, `${activeLesson.title} - ${ex.title}`, isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE', idx);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 shadow-sm keep-white ${
                            isAccuracyFirst
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <span>{isAccuracyFirst ? 'Start (No ⌫)' : 'Start'}</span>
                          <span className="text-[10px]">→</span>
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

      {/* ================= 10-DAY ROADMAP VIEW ================= */}
      {activeTab === 'roadmap' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  10-Day Speed Mastery Plan
                </h3>
                <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5">
                  Follow this daily structured regimen to progress from beginners to 40+ WPM.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                Current: <span className="text-indigo-600 dark:text-indigo-400 font-bold">Day {dayProgress.currentDay} / 10</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {MASTERY_PLAN.map(dp => {
                const isCurrent = dp.day === dayProgress.currentDay;
                const isPast = dp.day < dayProgress.currentDay;
                const isSelected = selectedDayNumber === dp.day;

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
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/70 shadow-sm'
                        : isCurrent
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/50'
                          : isPast
                            ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isCurrent ? 'bg-amber-500 text-white keep-white' : isPast ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400'
                        }`}>
                          Day {dp.day}
                        </span>
                        {isAllDone ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">✓ Done</span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-500">{completedCount}/{dayLessons.length}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 leading-tight">{dp.title}</h4>
                      <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-1">Target: {dp.targetWpm} WPM</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-500 font-mono">
                      <span>{dp.minSessions} Sessions</span>
                      <span className="text-slate-700 dark:text-neutral-300 font-bold">View →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= HAND ISOLATION VIEW (LEFT / RIGHT HAND ONLY) ================= */}
      {activeTab === 'hands' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>✋</span>
                  <span>Hand Isolation & Bimanual Coordination</span>
                </h3>
                <p className="text-slate-500 dark:text-neutral-400 text-xs mt-1 max-w-2xl leading-relaxed">
                  Isolate single-hand neural motor pathways to eliminate inter-manual compensation and build genuine bilateral independence.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Hand Only */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider">
                      Left Hand Only
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                      Q W E R T A S D F G Z X C V B
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Left Hand Motor Dominance</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Words formed strictly using left hand keys to strengthen non-dominant finger flexors.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-neutral-300 line-clamp-2">
                    sweater water great street brave tract create secret state draft target craft dwarf debate
                  </div>
                </div>

                <button
                  onClick={() => onSelectExercise(
                    'sweater water great street brave tract create secret state draft target craft dwarf debate reserve adverse average beware cater cascade defeat defer effect grass scatter steward baggage cabbage facade gaze garage radar raster refer safeguard savage setback stare strafe terrace tracker wafer waste watercraft weave werewolf',
                    'left-hand-drill',
                    'Left Hand Only Mastery Drill',
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE'
                  )}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold transition-all shadow-sm keep-white"
                >
                  Start Left Hand Drill →
                </button>
              </div>

              {/* Right Hand Only */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider">
                      Right Hand Only
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
                      Y U I O P H J K L N M
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Right Hand Precision & Reach</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Words formed purely with right hand digits to train lumbrical agility and reach accuracy.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-neutral-300 line-clamp-2">
                    monk look hill pool jolly union hook onion puppy imply milk moon plum pink kill million oily
                  </div>
                </div>

                <button
                  onClick={() => onSelectExercise(
                    'monk look hill pool jolly union hook onion puppy imply milk moon plum pink kill million oily poppy hymn loin yolk monopoly lollipop lymph minim puny ю link hull lull oily pony lion look jump monk hill pulp onion join loop moon plum hook junk holy pull polo poly pomp plump kill milk pill pip pop',
                    'right-hand-drill',
                    'Right Hand Only Precision Drill',
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE'
                  )}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold transition-all shadow-sm keep-white"
                >
                  Start Right Hand Drill →
                </button>
              </div>

              {/* Alternating Hands (Bimanual Cadence) */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">
                      Alternating Rhythm
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
                      Left ↔ Right Flow
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Strict Alternating Hand Cadence</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Sequences where keystrokes bounce back and forth between hands to maximize flow and WPM.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-neutral-300 line-clamp-2">
                    problem authentic balance formal handle island panic visual dismantle penalty visual enamel
                  </div>
                </div>

                <button
                  onClick={() => onSelectExercise(
                    'problem authentic balance formal handle island panic visual dismantle penalty visual enamel authentic handle visual formal island penalty problem dismantle balance formal handle visual problem penalty authentic island formal balance visual handle dismantle problem penalty authentic visual balance formal island',
                    'alternating-hand-drill',
                    'Bimanual Alternating Rhythm Drill',
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE'
                  )}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold transition-all shadow-sm keep-white"
                >
                  Start Alternating Drill →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PER-FINGER LAB VIEW ================= */}
      {activeTab === 'fingers' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🖐️</span>
                <span>Individual Digit Calibration (10-Finger Lab)</span>
              </h3>
              <p className="text-slate-500 dark:text-neutral-400 text-xs mt-1 leading-relaxed">
                Click any finger to isolate its specific anatomical keys and launch a high-repetition targeted neuro-drill.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { id: 'lp', name: 'Left Pinky', keys: 'Q, A, Z, 1', text: 'aza aqa aza zqa qaz aza qaz zqa aqa zza qqa aza zqa aqa zza qqa aza qaz zqa aqa zza qqa aza qaz zqa aqa zza qqa' },
                { id: 'lr', name: 'Left Ring', keys: 'W, S, X, 2', text: 'sws sxs wsw xsx sws xsx wsw sxs sws xsx wsw sxs sws xsx wsw sxs sws xsx wsw sxs sws xsx wsw sxs sws xsx wsw sxs' },
                { id: 'lm', name: 'Left Middle', keys: 'E, D, C, 3', text: 'ded dcd ede cdc ded dcd ede cdc ded dcd ede cdc ded dcd ede cdc ded dcd ede cdc ded dcd ede cdc ded dcd ede cdc' },
                { id: 'li', name: 'Left Index', keys: 'R, T, F, G, V, B, 4, 5', text: 'frf ftf fgf fvf fbf rfr tft gfg vfv bfb frf ftf fgf fvf fbf rfr tft gfg vfv bfb frf ftf fgf fvf fbf rfr tft gfg vfv bfb' },
                { id: 'thumb', name: 'Thumbs', keys: 'Spacebar Cadence', text: 'a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p q r s t u v w x y z' },
                { id: 'ri', name: 'Right Index', keys: 'Y, U, H, J, N, M, 6, 7', text: 'juj jyj jhj jnj jmj uju yjy hjh njn mjm juj jyj jhj jnj jmj uju yjy hjh njn mjm juj jyj jhj jnj jmj uju yjy hjh njn mjm' },
                { id: 'rm', name: 'Right Middle', keys: 'I, K, Comma, 8', text: 'kik k,k iki ,k, kik k,k iki ,k, kik k,k iki ,k, kik k,k iki ,k, kik k,k iki ,k, kik k,k iki ,k, kik k,k iki ,k, kik k,k' },
                { id: 'rr', name: 'Right Ring', keys: 'O, L, Period, 9', text: 'lol l.l olo .l. lol l.l olo .l. lol l.l olo .l. lol l.l olo .l. lol l.l olo .l. lol l.l olo .l. lol l.l olo .l. lol l.l' },
                { id: 'rp', name: 'Right Pinky', keys: 'P, ;, /, 0, -, Enter', text: ';p; ;/; p;p /;/ ;p; ;/; p;p /;/ ;p; ;/; p;p /;/ ;p; ;/; p;p /;/ ;p; ;/; p;p /;/ ;p; ;/; p;p /;/ ;p; ;/; p;p /;/' },
              ].map(f => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-3 hover:border-indigo-500/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{f.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                        {f.keys}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 line-clamp-1 mt-1">
                      {f.text}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectExercise(f.text, `digit-${f.id}`, `${f.name} Isolation Drill`, isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE')}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold font-mono transition-all"
                  >
                    Drill {f.name} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= CAPS LOCK & SHIFT LAB VIEW ================= */}
      {activeTab === 'caps' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔠</span>
                <span>Caps Lock & Shift Mastery Suite</span>
              </h3>
              <p className="text-slate-500 dark:text-neutral-400 text-xs mt-1 leading-relaxed">
                Train pinky endurance for shift key hold/release cycles, full uppercase bursts, and programming camelCase strings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Caps Lock Legal & Official Burst */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono uppercase">
                      ALL CAPS BURST
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                      CAPS LOCK
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Legal & Official Notices</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Continuous uppercase typing for legal notices, court orders, and administrative headers.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-neutral-300 line-clamp-2">
                    THE HIGH COURT OF JUDICATURE AT ALLAHABAD HEREBY DIRECTS ALL CANDIDATES TO COMPLY WITH STATUTORY REGULATIONS
                  </div>
                </div>

                <button
                  onClick={() => onSelectExercise(
                    'THE HIGH COURT OF JUDICATURE AT ALLAHABAD HEREBY DIRECTS ALL CANDIDATES TO COMPLY WITH STATUTORY REGULATIONS AND COMPLETE EXAMINATIONS WITHIN THE STIPULATED TEN MINUTE PERIOD WITHOUT UNAUTHORIZED INTERRUPTIONS. THE ORDER OF THE SUPREME COURT OF INDIA SHALL REMAIN BINDING UPON ALL RECRUITMENT BOARDS AND NODAL COMMISSIONS ACROSS ALL JURISDICTIONS.',
                    'caps-lock-notice',
                    'All-Caps Legal Notice Drill',
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE'
                  )}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold transition-all shadow-sm keep-white"
                >
                  Start Caps Lock Drill →
                </button>
              </div>

              {/* Shift Key CamelCase & Acronyms */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono uppercase">
                      Shift Key Cadence
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                      CamelCase & Acronyms
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Technical & Code Identifiers</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Rapid shift key engage/disengage transitions for programmers, data entry, and technical writers.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-neutral-300 line-clamp-2">
                    JavaScript TypeScript ReactNode HTTP JSON UUID API HTML CSS URL XML NASA UNESCO
                  </div>
                </div>

                <button
                  onClick={() => onSelectExercise(
                    'JavaScript TypeScript ReactNode useEffect useState handleButtonClick getElementById innerHTML querySelector JSON UUID HTTP HTTPS API RESTful GraphQL SQL NoSQL HTML CSS SVG NASA UNESCO UNICEF WHO IMF NATO BBC CNN IBM Apple Microsoft Google Amazon Oracle Intel Nvidia AMD Tesla',
                    'shift-camelcase',
                    'Shift Key & Acronym Drill',
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE'
                  )}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition-all shadow-sm keep-white"
                >
                  Start Shift Cadence Drill →
                </button>
              </div>

              {/* Symbols & Punctuation */}
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono uppercase">
                      Punctuation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                      Symbols & Special Keys
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Symbols & Complex Syntax</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Upper row number shifts and punctuation keys essential for programming and formal typing.
                  </p>
                  <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-[11px] font-mono text-slate-600 dark:text-neutral-300 line-clamp-2">
                    {"{ count: 100, price: $45.90, valid: (score >= 90) && (rating != null) }"}
                  </div>
                </div>

                <button
                  onClick={() => onSelectExercise(
                    '{"id": 402, "status": "APPROVED", "rate": 18.5%, "balance": $1,250.00}; function test(a, b) { return (a > b) ? [a * 2] : (b / 4); }; /* Important Notice */ user@domain.org & admin@gov.in (Ref: #890-XYZ)! 100% of 50 = 50; @mohit #snaptype *key* _value_ +item -cost',
                    'symbols-drill',
                    'Punctuation & Syntax Mastery',
                    isAccuracyFirst ? 'NO_BACKSPACE' : 'NONE'
                  )}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold transition-all shadow-sm keep-white"
                >
                  Start Symbols Drill →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= FINGER DECOUPLING (COLLISION FIX) VIEW ================= */}
      {activeTab === 'collision' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Finger Decoupling & Neighbor Isolation
                </h3>
                <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5 max-w-2xl leading-relaxed">
                  Eliminates Same-Finger Reach overshoots (Index/Pinky reach errors) and Neighbor Tendon crosstalk (Ring vs Middle co-firing).
                </p>
              </div>

              <button
                onClick={() => handleStartCollisionDrill()}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white keep-white transition-all flex items-center gap-2 shrink-0 font-mono shadow-sm"
              >
                <span>Launch Disentangler Drill</span>
                <span>→</span>
              </button>
            </div>

            {/* Diagnostic Collision Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-neutral-400">Total Analyzed Misclicks</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {adaptiveProfile.collisionStats?.totalErrors || 0}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">Keystroke audits</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-semibold text-indigo-600 dark:text-indigo-300">Same-Finger Reach Errors</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {adaptiveProfile.collisionStats?.sameFingerRatio || 0}%
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-1">
                  {adaptiveProfile.collisionStats?.sameFingerErrors || 0} <span className="text-xs font-normal text-slate-400 dark:text-neutral-400">misreaches</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">e.g. Index R↔T, F↔G, V↔B</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono font-semibold text-indigo-600 dark:text-indigo-300">Neighbor Finger Crosstalk</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {adaptiveProfile.collisionStats?.neighborRatio || 0}%
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-1">
                  {adaptiveProfile.collisionStats?.neighborErrors || 0} <span className="text-xs font-normal text-slate-400 dark:text-neutral-400">collisions</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5">e.g. Ring vs Middle W↔E, S↔D</span>
              </div>
            </div>

            {/* Active Conflict Pairs Hotlist */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-2.5">
                Active Conflict Pairs (Click to Practice)
              </span>

              {adaptiveProfile.collisionStats?.topConflicts && adaptiveProfile.collisionStats.topConflicts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {adaptiveProfile.collisionStats.topConflicts.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStartCollisionDrill(`${c.expected}-${c.typed}`)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 flex items-center gap-2 transition-all text-xs font-mono"
                    >
                      <span className="font-bold text-indigo-600 dark:text-indigo-300 uppercase">
                        {c.expected} ↔ {c.typed}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-400">
                        {c.count} errors
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {['r-t', 'f-g', 'v-b', 'w-e', 's-d', 'u-y', 'i-o', 'k-l'].map(pair => (
                    <button
                      key={pair}
                      onClick={() => handleStartCollisionDrill(pair)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-white transition-all uppercase"
                    >
                      {pair} →
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Curated Biomechanical Isolation Passages Grid */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-3">
              Curated Finger Decoupling Passages (1,000+ Chars)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {collisionPassages.map(p => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-neutral-300">
                        {p.difficulty}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                        ~{p.wordCount} words
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {p.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectExercise(p.text, p.id, p.title)}
                    className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white keep-white transition-all flex items-center justify-center gap-1.5 font-mono"
                  >
                    <span>Start Drill</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= FINGER RADAR VIEW ================= */}
      {activeTab === 'weakness' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="p-6 md:p-7 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">9-Finger Biomechanical Radar</h3>
                <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5 max-w-xl">
                  SnapType monitors individual finger impact velocity, misclicks, and anchor drift.
                </p>
              </div>

              <button
                onClick={handleStartWeaknessDrill}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white keep-white transition-all flex items-center gap-2 shadow-sm font-mono"
              >
                <span>Repair Weak Fingers</span>
                <span>→</span>
              </button>
            </div>

            {/* Error-Prone Keys Highlight Chips */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-2">
                Identified Error-Prone Keycaps
              </span>
              {adaptiveProfile.weakestKeys.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {adaptiveProfile.weakestKeys.map(k => {
                    const stats = adaptiveProfile.keyStats[k];
                    const errRate = stats ? Math.round(stats.lastErrorRate * 100) : 0;
                    return (
                      <div
                        key={k}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5"
                      >
                        <span className="font-mono font-bold text-rose-700 dark:text-white text-xs uppercase">
                          {k === ' ' ? 'Space' : k}
                        </span>
                        <span className="text-[10px] font-mono text-rose-600 dark:text-rose-300 font-semibold">
                          {errRate}% err
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 dark:text-neutral-500 text-xs italic">
                  Complete 2-3 drills to let the AI calibrate your per-finger error frequency.
                </p>
              )}
            </div>

            {/* 9-Finger Accuracy Bars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ORDERED_FINGERS.map(fingerId => {
                const meta = FINGER_META[fingerId];
                const stats = adaptiveProfile.fingerStats[fingerId];
                const attempts = stats?.totalAttempts || 0;
                const errors = stats?.totalErrors || 0;
                const accuracy = attempts > 0 ? Math.max(0, Math.round(((attempts - errors) / attempts) * 100)) : 100;

                const isWeak = adaptiveProfile.weakestFingers.includes(fingerId);
                const colorClass =
                  accuracy >= 95
                    ? 'bg-emerald-500'
                    : accuracy >= 85
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                return (
                  <div
                    key={fingerId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isWeak
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{meta.label}</span>
                          {isWeak && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-500/30 text-rose-700 dark:text-rose-200 font-bold">
                              Drill
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">{meta.defaultKeys}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{accuracy}%</span>
                        <div className="text-[9px] font-mono text-slate-400 dark:text-neutral-500">{attempts} hits</div>
                      </div>
                    </div>

                    {/* Accuracy Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorClass} transition-all duration-300 rounded-full`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
