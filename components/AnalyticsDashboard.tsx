import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line } from 'recharts';
import { StoredResult, UserStats, FingerId, AdaptiveProfile, GameMode, TimeLimit } from '../types';
import { getAdaptiveProfile, getUserStats, generateWeaknessDrill, generateCollisionRepairDrill } from '../services/storageService';
import { getStoredTheme } from '../services/themeService';
import { BADGES } from '../services/badgeRules';
import { MASTERY_PLAN } from '../data/lessonsData';

interface AnalyticsDashboardProps {
  history: StoredResult[];
  stats: UserStats | null;
  onLaunchDrill: (text: string, id: string, title: string) => void;
  onSelectSavedTest?: (testId: string) => void;
  onNavigateTab: (tab: 'LESSONS' | 'PRACTICE' | 'CREATE') => void;
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

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  history,
  stats,
  onLaunchDrill,
  onNavigateTab,
}) => {
  const [chartMetric, setChartMetric] = useState<'wpm' | 'accuracy'>('wpm');
  const [isLight, setIsLight] = useState(() => getStoredTheme() === 'light');

  useEffect(() => {
    const handler = () => setIsLight(getStoredTheme() === 'light');
    window.addEventListener('snaptype-theme-change', handler);
    return () => window.removeEventListener('snaptype-theme-change', handler);
  }, []);

  const adaptiveProfile: AdaptiveProfile = useMemo(() => getAdaptiveProfile(), [history]);
  const userStats: UserStats = stats || getUserStats();

  // Summary Metrics
  const avgWpm = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((acc, cur) => acc + cur.netWpm, 0) / history.length);
  }, [history]);

  const avgAccuracy = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((acc, cur) => acc + cur.accuracy, 0) / history.length);
  }, [history]);

  const avgRealAccuracy = useMemo(() => {
    const validHistory = history.filter(h => typeof h.realAccuracy === 'number');
    if (validHistory.length === 0) return avgAccuracy;
    return Math.round(validHistory.reduce((acc, cur) => acc + (cur.realAccuracy ?? cur.accuracy), 0) / validHistory.length);
  }, [history, avgAccuracy]);

  const totalMinutes = useMemo(() => {
    return Math.round((userStats.totalTimeSeconds || 0) / 60);
  }, [userStats.totalTimeSeconds]);

  // Rank Tier Calculation based on XP and Best WPM
  const rankTier = useMemo(() => {
    const best = userStats.bestWpm;
    if (best >= 60) return { name: 'Grandmaster Typist', color: 'from-amber-400 to-yellow-200 text-black', badge: '👑' };
    if (best >= 45) return { name: 'Expert Stenographer', color: 'from-purple-500 to-indigo-400 text-white', badge: '💎' };
    if (best >= 35) return { name: 'Clerk Exam Qualified', color: 'from-emerald-400 to-teal-300 text-black', badge: '⚡' };
    if (best >= 25) return { name: 'Intermediate Typist', color: 'from-blue-500 to-cyan-400 text-white', badge: '🚀' };
    return { name: 'Apprentice Typist', color: 'from-neutral-700 to-neutral-600 text-white', badge: '🌱' };
  }, [userStats.bestWpm]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    return history.map((entry, idx) => {
      const windowItems = history.slice(Math.max(0, idx - 4), idx + 1);
      const rollingWpm = Math.round(windowItems.reduce((s, e) => s + e.netWpm, 0) / windowItems.length);
      const rollingAcc = Math.round(windowItems.reduce((s, e) => s + e.accuracy, 0) / windowItems.length);
      return {
        ...entry,
        index: idx + 1,
        dateLabel: new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        rollingWpm,
        rollingAcc,
      };
    });
  }, [history]);

  const handleLaunchCollisionRepair = (pair?: string) => {
    const drillText = generateCollisionRepairDrill(adaptiveProfile, pair);
    onLaunchDrill(drillText, `collision-${pair || 'ai'}`, `Targeted Collision Repair (${pair?.toUpperCase() || 'AI'})`);
  };

  const handleLaunchWeaknessRepair = () => {
    const drillText = generateWeaknessDrill(adaptiveProfile);
    onLaunchDrill(drillText, 'adaptive-weakness', 'AI Biomechanical Weakness Drill');
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      {/* 1. Header Banner & Executive Rank Cockpit */}
      <div className="bento-card p-6 md:p-8 bg-white dark:bg-gradient-to-r dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
              Performance Intelligence & Biomechanical Hub
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r ${rankTier.color} shadow`}>
              {rankTier.badge} {rankTier.name}
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Typing Analytics & Hardware Biometrics
          </h2>
          <p className="text-slate-600 dark:text-neutral-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
            Continuous diagnostic tracking across all 9 typing fingers, hardware keystroke latency, neuromuscular collision patterns, and exam qualifications.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleLaunchWeaknessRepair}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all font-mono shadow-md flex items-center gap-1.5"
          >
            <span>🦾 Repair Weak Fingers</span>
            <span>→</span>
          </button>
          <button
            onClick={() => onNavigateTab('LESSONS')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-mono shadow-md flex items-center gap-1.5"
          >
            <span>📚 Go to Lessons</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-neutral-400">Total Tests</span>
          <div className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{history.length}</div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 mt-1">Sessions logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-indigo-600 dark:text-indigo-300">Average Speed</span>
          <div className="text-2xl md:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-300 mt-1">{avgWpm} <span className="text-xs font-normal">WPM</span></div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 mt-1">Rolling average</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-amber-600 dark:text-amber-400">Personal Best</span>
          <div className="text-2xl md:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{userStats.bestWpm} <span className="text-xs font-normal">WPM</span></div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 mt-1">All-time record</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400">Final Accuracy</span>
          <div className="text-2xl md:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{avgAccuracy}%</div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 mt-1">
            Real: <strong className="text-cyan-700 dark:text-cyan-300">{avgRealAccuracy}%</strong>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-orange-600 dark:text-orange-400">Daily Streak</span>
          <div className="text-2xl md:text-3xl font-black font-mono text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
            <span>🔥</span>
            <span>{userStats.currentStreak}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 mt-1">Days active</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-cyan-700 dark:text-cyan-300">Total Practice</span>
          <div className="text-2xl md:text-3xl font-black font-mono text-cyan-700 dark:text-cyan-300 mt-1">{totalMinutes} <span className="text-xs font-normal">min</span></div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 mt-1">Focused keyboard time</span>
        </div>
      </div>

      {/* 3. 10-Day Mastery Bootcamp Status Bar */}
      <div className="p-5 md:p-6 rounded-3xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-2xl shrink-0">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-300 font-bold">
                10-Day Zero to 40+ WPM Bootcamp
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-white font-bold">
                Day {adaptiveProfile.currentDay} of 10
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Current Target: {MASTERY_PLAN[adaptiveProfile.currentDay - 1]?.title || 'Speed Booster & Fluidity'} ({MASTERY_PLAN[adaptiveProfile.currentDay - 1]?.targetWpm || 40} WPM)
            </h4>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('LESSONS')}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500 hover:bg-indigo-400 text-white transition-all shrink-0 font-mono"
        >
          Open Bootcamp Plan →
        </button>
      </div>

      {/* 4. Speed & Accuracy Evolution Chart */}
      <div className="bento-card p-6 md:p-8 bg-white dark:bg-neutral-950/80 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📈 Session Velocity & Accuracy Progression</span>
            </h3>
            <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5">
              Historical speed curve with 5-session rolling exponential smoothing.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setChartMetric('wpm')}
              className={`text-xs font-mono px-3 py-1 rounded-lg font-bold transition-all ${
                chartMetric === 'wpm' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Speed (WPM)
            </button>
            <button
              onClick={() => setChartMetric('accuracy')}
              className={`text-xs font-mono px-3 py-1 rounded-lg font-bold transition-all ${
                chartMetric === 'accuracy' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Accuracy (%)
            </button>
          </div>
        </div>

        {chartData.length > 1 ? (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e2e8f0" : "#262626"} vertical={false} />
                <XAxis dataKey="index" tickFormatter={v => `#${v}`} stroke={isLight ? "#94a3b8" : "#737373"} tick={{ fontSize: 10, fill: isLight ? "#64748b" : "#a3a3a3" }} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={isLight ? "#94a3b8" : "#737373"}
                  tick={{ fontSize: 10, fill: isLight ? "#64748b" : "#a3a3a3" }}
                  tickLine={false}
                  axisLine={false}
                  domain={chartMetric === 'wpm' ? [0, (max: number) => Math.max(40, Math.ceil((max + 10) / 10) * 10)] : [70, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/15 rounded-xl shadow-xl text-xs font-mono">
                        <div className="text-slate-500 dark:text-neutral-400 text-[10px]">{d.dateLabel} (Test #{d.index})</div>
                        <div className="text-slate-900 dark:text-white font-bold text-sm mt-1">Net Speed: {d.netWpm} WPM</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Accuracy: {d.accuracy}%</div>
                        <div className="text-slate-400 dark:text-neutral-500 text-[10px] mt-0.5">Rolling Avg: {d.rollingWpm} WPM</div>
                      </div>
                    );
                  }}
                />
                {chartMetric === 'wpm' ? (
                  <>
                    <Area type="monotone" dataKey="netWpm" stroke="#818cf8" fill="#818cf8" fillOpacity={isLight ? 0.25 : 0.15} strokeWidth={2} />
                    <Line type="monotone" dataKey="rollingWpm" stroke={isLight ? "#6366f1" : "#a78bfa"} strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                  </>
                ) : (
                  <>
                    <Area type="monotone" dataKey="accuracy" stroke="#10b981" fill="#10b981" fillOpacity={isLight ? 0.25 : 0.15} strokeWidth={2} />
                    <Line type="monotone" dataKey="rollingAcc" stroke={isLight ? "#059669" : "#6ee7b7"} strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 dark:text-neutral-500 text-xs">
            <span className="text-2xl mb-2">📊</span>
            <span>Complete at least 2 typing sessions to generate the live velocity chart.</span>
          </div>
        )}
      </div>

      {/* 5. Biomechanical 9-Finger Velocity & Reflex Matrix */}
      <div className="bento-card p-6 md:p-8 bg-white dark:bg-neutral-950/80 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🦾 9-Finger Hardware Reflex & Accuracy Audit</span>
            </h3>
            <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5">
              Live keystroke latency (ms) and error frequency mapped across left and right hands.
            </p>
          </div>
          <button
            onClick={handleLaunchWeaknessRepair}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white dark:hover:text-black dark:text-white transition-all font-mono shadow-xs"
          >
            Launch Targeted Repair →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ORDERED_FINGERS.map(fingerId => {
            const meta = FINGER_META[fingerId];
            const stats = adaptiveProfile.fingerStats[fingerId];
            const attempts = stats?.totalAttempts || 0;
            const errors = stats?.totalErrors || 0;
            const accuracy = attempts > 0 ? Math.max(0, Math.round(((attempts - errors) / attempts) * 100)) : 100;
            const latency = stats?.avgLatencyMs || 180;
            const isWeak = adaptiveProfile.weakestFingers.includes(fingerId);

            return (
              <div
                key={fingerId}
                className={`p-4 rounded-2xl border transition-all ${
                  isWeak ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/40 shadow-xs' : 'bg-slate-50 dark:bg-neutral-900/50 border-slate-200 dark:border-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{meta.label}</span>
                      {isWeak && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/30 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-500/40 font-semibold">
                          Weak Link
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">{meta.defaultKeys}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`text-sm font-bold ${accuracy >= 95 ? 'text-emerald-600 dark:text-emerald-400' : accuracy >= 88 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {accuracy}%
                    </span>
                    <div className="text-[9px] text-slate-400 dark:text-neutral-400">~{latency}ms reflex</div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      accuracy >= 95 ? 'bg-emerald-500' : accuracy >= 88 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>

                {stats?.weakKeys && stats.weakKeys.length > 0 && (
                  <div className="text-[10px] font-mono text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                    <span>Faults:</span>
                    <span className="text-rose-600 dark:text-rose-300 font-bold uppercase">{stats.weakKeys.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Neuro-Muscular Finger Collision Breakdown */}
      <div className="bento-card p-6 md:p-8 bg-white dark:bg-neutral-950/80 border border-cyan-400/40 dark:border-cyan-500/30 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-cyan-500">⚡</span>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-700 dark:text-cyan-300 font-bold">
                Tendon & Reach Collision Diagnostic
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Same-Finger Reach Overshoots vs Neighbor Crosstalk
            </h3>
          </div>

          <button
            onClick={() => handleLaunchCollisionRepair()}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-400 dark:text-black dark:hover:bg-cyan-300 transition-all font-mono shadow-xs"
          >
            Launch AI Disentangler →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-700 dark:text-cyan-300">Same-Finger Reach Errors</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-cyan-200 mt-1">
              {adaptiveProfile.collisionStats?.sameFingerRatio || 0}%
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1">
              Index / Pinky multi-reach spatial confusion (e.g. R↔T, F↔G, V↔B).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10">
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-700 dark:text-indigo-300">Neighbor Tendon Crosstalk</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-indigo-200 mt-1">
              {adaptiveProfile.collisionStats?.neighborRatio || 0}%
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1">
              Adjacent fingers co-firing due to linked extensor tendons (e.g. W↔E, S↔D).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-700 dark:text-amber-300">Active Conflict Hotlist</span>
            {adaptiveProfile.collisionStats?.topConflicts && adaptiveProfile.collisionStats.topConflicts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {adaptiveProfile.collisionStats.topConflicts.slice(0, 3).map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLaunchCollisionRepair(`${c.expected}-${c.typed}`)}
                    className="px-2 py-1 rounded bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 text-cyan-900 dark:bg-cyan-500/15 dark:border-cyan-500/30 dark:text-cyan-200 font-mono text-[10px] font-bold dark:hover:bg-cyan-500/30 transition-colors"
                  >
                    {c.expected.toUpperCase()} ↔ {c.typed.toUpperCase()} ({c.count}x)
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 italic mt-2">No heavy tendon conflicts detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* 7. Trophy Room & Badges Showcase */}
      <div className="bento-card p-6 md:p-8 bg-white dark:bg-neutral-950/80 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏆 Achievements & Trophy Room</span>
            </h3>
            <p className="text-slate-500 dark:text-neutral-400 text-xs mt-0.5">
              Unlocked: {userStats.unlockedBadges.length} / {BADGES.length} Milestones ({userStats.xp} Total XP)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {BADGES.map(badge => {
            const isUnlocked = userStats.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center ${
                  isUnlocked
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-50 dark:bg-neutral-900/40 border-slate-200 dark:border-white/5 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{badge.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-1 leading-snug">{badge.description}</p>
                <span className={`text-[9px] font-mono mt-2 px-2 py-0.5 rounded-full font-bold ${
                  isUnlocked ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-200 text-slate-600 dark:bg-neutral-800 dark:text-neutral-500'
                }`}>
                  {isUnlocked ? '✓ Unlocked' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Recent Typing Session Log Table */}
      <div className="bento-card p-6 md:p-8 bg-white dark:bg-neutral-950/80 border border-slate-200 dark:border-white/10 rounded-3xl shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📜 Recent Session Audit Trail</span>
          <span className="text-xs text-slate-500 font-normal font-mono">(Last {Math.min(15, history.length)} Sessions)</span>
        </h3>

        {history.length > 0 ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-neutral-400 text-[10px] uppercase">
                  <th className="pb-3 pr-4">Date & Time</th>
                  <th className="pb-3 px-4">Speed</th>
                  <th className="pb-3 px-4">Accuracy</th>
                  <th className="pb-3 px-4">Mode</th>
                  <th className="pb-3 px-4">Reflex</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {[...history].reverse().slice(0, 15).map(entry => {
                  const isQualified = entry.netWpm >= 35 && entry.accuracy >= 90;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-4 text-slate-700 dark:text-neutral-300 text-[11px]">
                        {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-sm">
                        {entry.netWpm} <span className="text-[10px] font-normal text-slate-500 dark:text-neutral-400">WPM</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {entry.accuracy}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-white/10 text-[10px] uppercase dark:text-neutral-300">
                          {entry.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-neutral-400">
                        {entry.avgLatencyMs ? `~${entry.avgLatencyMs}ms` : '—'}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isQualified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                        }`}>
                          {isQualified ? '✓ Qualified' : 'Under Goal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400 dark:text-neutral-500 text-xs italic">No session logs recorded yet.</p>
        )}
      </div>
    </div>
  );
};
