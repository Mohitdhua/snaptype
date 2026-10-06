import React from 'react';
import { Button } from './Button';
import { TimeLimit } from '../types';

export const AccuracyLab: React.FC<{ onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void }> = ({ onStartDrill }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-fade-in text-center px-4 md:px-8 mt-4 md:mt-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-6 border border-blue-100 dark:border-blue-500/20">
        Precision-First Protocol
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
        Accuracy Lab
      </h1>
      <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-2xl font-medium">
        Target specific spatial and timing errors without temporal pressure. WPM is ignored until accuracy stabilizes above 98%.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
        <div className="p-8 md:p-10 rounded-[2rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.1)] group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
            🎯
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">High-Frequency Errors</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Dynamically generated drill based on your most frequently missed spatial targets from the last 5 sessions.
          </p>
          <Button 
            onClick={() => onStartDrill("the quick brown fox jumps over the lazy dog", "Adaptive Accuracy Drill", 0)}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-2xl transition-all"
          >
            Generate Drill
          </Button>
        </div>

        <div className="p-8 md:p-10 rounded-[2rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.1)] group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            🧠
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Variable Sequence</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Randomized morphemes and digraphs to enforce contextual interference and improve motor pattern retention.
          </p>
          <Button 
            onClick={() => onStartDrill("tion ment ence ance ship ness able", "Variable Transfer Drill", 0)}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold rounded-2xl transition-all"
          >
            Generate Drill
          </Button>
        </div>
      </div>
    </div>
  );
};

export const SpeedLab: React.FC<{ onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void }> = ({ onStartDrill }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-fade-in text-center px-4 md:px-8 mt-4 md:mt-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-6 border border-amber-100 dark:border-amber-500/20">
        Temporal Demand
      </div>

      <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
        Speed Lab
      </h1>
      <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-2xl font-medium">
        Controlled temporal pressure. Speed is only introduced as a secondary emergent property of neuromuscular efficiency.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
        <div className="relative overflow-hidden p-8 md:p-10 rounded-[2rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.1)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] -mr-10 -mt-10 rounded-full pointer-events-none" />
          
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 group-hover:scale-110 transition-transform">
            ⚡
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Controlled Speed Burst</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Short duration (15s). Pushes impulse variability theory to the limit. Must maintain &gt;96% accuracy.
          </p>
          <Button 
            onClick={() => onStartDrill("it is a good day to type fast and accurately", "15s Burst", 15)}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-[0_4px_20px_rgba(225,29,72,0.3)]"
          >
            Start Burst
          </Button>
        </div>

        <div className="relative overflow-hidden p-8 md:p-10 rounded-[2rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_16px_60px_-15px_rgba(0,0,0,0.1)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] -mr-10 -mt-10 rounded-full pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
            ⏱️
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Threshold Pacing</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Sustained moderate speed (60s). Focus on consistent Inter-Keystroke Intervals to minimize neuro-motor noise.
          </p>
          <Button 
            onClick={() => onStartDrill("sustain a consistent rhythm to ensure neuro-motor noise is minimized", "60s Threshold", 60)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
          >
            Start Threshold
          </Button>
        </div>
      </div>
    </div>
  );
};
