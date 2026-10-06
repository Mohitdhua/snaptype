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
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-fade-in text-center px-4 md:px-8 mt-4 md:mt-12">
      
      {/* Elite Typography Heading */}
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
        What should I practice today?
      </h1>
      <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-2xl font-medium">
        Your adaptive training recommendation based on current neuromuscular bottlenecks.
      </p>

      {/* Hero Recommendation Card (Elite Styling) */}
      <div className="w-full relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] mb-12 group transition-all hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.4)]">
        
        {/* Subtle background glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[80px] pointer-events-none rounded-full" />

        <div className="relative z-10 p-10 md:p-14 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-6 border border-indigo-100 dark:border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Primary Weakness Detected
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            Digit III ↔ Digit IV Transition
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 max-w-xl text-center leading-relaxed font-medium mb-8">
            Recent sessions indicate a 12% increase in temporal variability during ring-to-middle finger transitions. We need to isolate this coupling.
          </p>
          
          <Button 
            onClick={() => onNavigateTab('TRAINING')}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-[0_4px_20px_rgba(79,70,229,0.4)] text-base font-bold rounded-2xl transition-all duration-300"
          >
            Start Targeted Training
          </Button>
        </div>
      </div>

      {/* Exquisite Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-4 md:gap-6 text-left">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0f131a] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-4">Total Tests</span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">{stats?.totalTests || 0}</div>
            <div className="text-xs font-semibold text-emerald-500 mt-1">Sessions Completed</div>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0f131a] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-4">Consistency</span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">94%</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">High retention</div>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0f131a] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest mb-4">Best WPM</span>
          <div>
            <div className="text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">{stats?.bestWpm || 0}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">All-time record</div>
          </div>
        </div>
        
        <button 
          onClick={() => onNavigateTab('TRAINING')}
          className="p-6 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex flex-col justify-center items-center hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl shadow-slate-900/10 dark:shadow-white/10 group"
        >
          <span className="text-lg font-black tracking-tight group-hover:-translate-y-0.5 transition-transform">Start Training</span>
          <span className="text-xs font-medium opacity-70 mt-1">Open Hub →</span>
        </button>
      </div>
      
    </div>
  );
};
