import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { HandsGuide } from './HandsGuide';
import { GameState, TimeLimit } from '../types';

interface FingerMotorTrainingProps {
  onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void;
  theme: string;
}

export const FingerMotorTraining: React.FC<FingerMotorTrainingProps> = ({ onStartDrill, theme }) => {
  const [selectedDigit, setSelectedDigit] = useState<string | null>(null);
  
  // Minimalist dataset for digit-specific transitions
  const transitions: Record<string, string[]> = {
    'Left Digit III ↔ Left Digit IV': ['wsx edc wsx edc wse dsw dex ces', 'sw de cx ew ds xc we sd'],
    'Right Digit III ↔ Right Digit IV': ['okm ijn okm ijn oki mjn iom jkn', 'ko mi no jm ik nj ok im'],
    'Left Digit II ↔ Left Digit III': ['rfv tgb edc rfv tgb edc', 'rt fg vb er df cv tr gf'],
  };

  const handleStart = (pair: string) => {
    const drillText = transitions[pair][0];
    onStartDrill(drillText, `Motor Training: ${pair}`, 60);
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Finger Motor Training</h1>
      <p className="text-sm opacity-70 mb-8 max-w-xl">
        Evidence-based sensorimotor training. Select an anatomical constraint to practice neuromuscular independence and spatial accuracy.
      </p>

      <div className="flex flex-col md:flex-row w-full gap-8">
        <div className="flex-1 bento-card p-6 flex flex-col items-center justify-center">
           <HandsGuide showOnly={selectedDigit ? [selectedDigit] : undefined} />
           <p className="text-xs opacity-50 mt-4">Anatomical mapping for visuomotor integration.</p>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-left mb-2">Targeted Transitions</h2>
          
          {Object.keys(transitions).map(pair => (
            <div key={pair} className="bento-card p-4 flex flex-col gap-3 text-left hover:border-indigo-500/30 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{pair}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded">Biomechanical Coupling</span>
              </div>
              <p className="text-xs opacity-70">Focuses on minimizing co-activation and improving inter-digit independence.</p>
              <Button onClick={() => handleStart(pair)} className="text-xs py-1.5 self-start">
                Start Drill
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
