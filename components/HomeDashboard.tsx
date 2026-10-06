import React from 'react';
import { Button } from './Button';
import { UserStats, TimeLimit } from '../types';

interface HomeDashboardProps {
  stats: UserStats | null;
  onNavigateTab: (tab: any) => void;
  onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ stats, onNavigateTab, onStartDrill }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        What should I practice today?
      </h1>
      <p className="text-sm opacity-70 mb-10 max-w-xl">
        Your adaptive training recommendation based on current neuromuscular bottlenecks.
      </p>

      <div className="w-full bento-card p-8 md:p-10 flex flex-col items-center gap-6 mb-8 border-indigo-500/20">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-60 mb-2">Primary Weakness Detected</span>
          <h2 className="text-2xl font-bold">Digit III ↔ Digit IV Transition</h2>
          <p className="text-sm opacity-70 mt-2 max-w-md text-center">
            Recent sessions indicate a 12% increase in temporal variability during ring-to-middle finger transitions. 
          </p>
        </div>
        
        <Button 
          onClick={() => onNavigateTab('FINGER_TRAINING')}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-sm font-semibold rounded-xl"
        >
          Start Targeted Training
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4 text-left">
        <div className="bento-card p-4">
          <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Total Tests</span>
          <div className="text-xl font-bold font-mono mt-1">{stats?.totalTests || 0}</div>
          <div className="text-xs text-emerald-400 mt-1">Completed</div>
        </div>
        <div className="bento-card p-4">
          <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Consistency</span>
          <div className="text-xl font-bold font-mono mt-1">94%</div>
          <div className="text-xs opacity-50 mt-1">High retention</div>
        </div>
        <div className="bento-card p-4">
          <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Best WPM</span>
          <div className="text-xl font-bold font-mono mt-1 opacity-70">{stats?.bestWpm || 0}</div>
          <div className="text-xs opacity-50 mt-1">All-time record</div>
        </div>
        <div className="bento-card p-4 flex flex-col justify-center items-center hover:bg-white/5 cursor-pointer transition-colors" onClick={() => onNavigateTab('ASSESSMENT')}>
          <span className="text-sm font-bold opacity-80">Take Assessment</span>
          <span className="text-[10px] text-indigo-400 mt-0.5">10-Min Exam →</span>
        </div>
      </div>

      {/* Quick Access Utility Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-3 mt-6">
        <button
          onClick={() => onNavigateTab('LESSONS')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-left transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🎓</span>
              <span>Lessons Suite</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Stages 1-6 • Per key • Left/Right</p>
          </div>
          <span className="text-xs font-mono text-indigo-500 font-bold">Open →</span>
        </button>

        <button
          onClick={() => onNavigateTab('FINGER_TRAINING')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-left transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🖐️</span>
              <span>Finger Motor</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Tendon unbinding & decoupling</p>
          </div>
          <span className="text-xs font-mono text-indigo-500 font-bold">Open →</span>
        </button>

        <button
          onClick={() => onNavigateTab('SETTINGS')}
          className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-left transition-all flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>⚙️</span>
              <span>Global Settings</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Test duration • Audio • Hardcore</p>
          </div>
          <span className="text-xs font-mono text-indigo-500 font-bold">Open →</span>
        </button>
      </div>
    </div>
  );
};
