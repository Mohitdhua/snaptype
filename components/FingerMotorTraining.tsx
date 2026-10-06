import React, { useState } from 'react';
import { Button } from './Button';
import { HandsGuide } from './HandsGuide';
import { TimeLimit } from '../types';

interface FingerMotorTrainingProps {
  onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void;
  theme: string;
}

export const FingerMotorTraining: React.FC<FingerMotorTrainingProps> = ({ onStartDrill, theme }) => {
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  
  // Minimalist dataset for digit-specific transitions
  const transitions: Record<string, { desc: string; text: string }> = {
    'Left Digit III ↔ IV': {
      desc: 'Isolates the Extensor Digitorum tendon coupling between middle and ring fingers to build neural independence.',
      text: 'wsx edc wsx edc wse dsw dex ces sw de cx ew ds xc we sd'
    },
    'Right Digit III ↔ IV': {
      desc: 'Counteracts mechanical binding of the right lumbricals during ascending row sequences.',
      text: 'okm ijn okm ijn oki mjn iom jkn ko mi no jm ik nj ok im'
    },
    'Left Digit II ↔ III': {
      desc: 'High-frequency transition practice to reduce temporal overlap and keystroke collisions.',
      text: 'rfv tgb edc rfv tgb edc rt fg vb er df cv tr gf'
    },
  };

  const handleStart = (pair: string, text: string) => {
    onStartDrill(text, `Motor Training: ${pair}`, 60);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center animate-fade-in text-center px-4 md:px-8 mt-4 md:mt-12">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-6 border border-emerald-100 dark:border-emerald-500/20">
        Biomechanics Lab
      </div>

      <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-slate-900 dark:text-white">
        Finger Motor Training
      </h1>
      <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-2xl font-medium">
        Evidence-based sensorimotor training. Select an anatomical constraint to practice neuromuscular independence and spatial accuracy.
      </p>

      <div className="flex flex-col lg:flex-row w-full gap-8">
        
        {/* Anatomical Visualization */}
        <div className="flex-1 rounded-[2rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-md mx-auto drop-shadow-xl transition-transform duration-500 group-hover:scale-[1.02]">
            <HandsGuide showOnly={selectedDigit ? [selectedDigit] : undefined} />
          </div>
          <p className="text-xs uppercase tracking-widest font-bold opacity-40 mt-8 relative z-10">
            Anatomical Visuomotor Mapping
          </p>
        </div>

        {/* Targeted Drills List */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-left mb-2 text-slate-900 dark:text-white px-2">Targeted Transitions</h2>
          
          {Object.entries(transitions).map(([pair, data]) => (
            <div 
              key={pair} 
              onMouseEnter={() => setSelectedDigit(pair.includes('Left') ? 'l' : 'r')}
              onMouseLeave={() => setSelectedDigit(null)}
              className="p-6 md:p-8 rounded-[1.5rem] bg-white dark:bg-[#0f131a] border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col gap-4 text-left hover:border-indigo-500/30 dark:hover:border-indigo-400/30 hover:shadow-[0_8px_30px_rgba(79,70,229,0.1)] transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-3">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{pair}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-500/20 whitespace-nowrap">
                  Biomechanical Coupling
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                {data.desc}
              </p>
              <Button 
                onClick={() => handleStart(pair, data.text)} 
                className="mt-2 text-sm font-bold py-3 px-6 self-start bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                Start Drill
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
