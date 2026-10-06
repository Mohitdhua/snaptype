import React from 'react';
import { Button } from './Button';
import { TimeLimit } from '../types';

export const AccuracyLab: React.FC<{ onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void }> = ({ onStartDrill }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Accuracy Lab</h1>
      <p className="text-sm opacity-70 mb-8 max-w-xl">
        Precision-first learning. Target specific spatial and timing errors without temporal pressure. WPM is ignored until accuracy stabilizes above 98%.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
        <div className="bento-card p-6">
          <h3 className="font-semibold mb-2">High-Frequency Errors</h3>
          <p className="text-xs opacity-70 mb-4">Dynamically generated drill based on your most frequently missed spatial targets.</p>
          <Button onClick={() => onStartDrill("the quick brown fox jumps over the lazy dog", "Adaptive Accuracy Drill", 0)}>Generate Drill</Button>
        </div>
        <div className="bento-card p-6">
          <h3 className="font-semibold mb-2">Variable Sequence Practice</h3>
          <p className="text-xs opacity-70 mb-4">Randomized morphemes and digraphs to enforce contextual interference and improve retention.</p>
          <Button onClick={() => onStartDrill("tion ment ence ance ship ness able", "Variable Transfer Drill", 0)}>Generate Drill</Button>
        </div>
      </div>
    </div>
  );
};

export const SpeedLab: React.FC<{ onStartDrill: (text: string, title: string, timeLimit: TimeLimit) => void }> = ({ onStartDrill }) => {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Speed Lab</h1>
      <p className="text-sm opacity-70 mb-8 max-w-xl">
        Controlled temporal demand. Speed is only introduced as a secondary emergent property of neuromuscular efficiency.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
        <div className="bento-card p-6 border-l-4 border-emerald-500/50">
          <h3 className="font-semibold mb-2">Controlled Speed Burst</h3>
          <p className="text-xs opacity-70 mb-4">Short duration (15s). Pushes impulse variability. Maintain &gt;96% accuracy.</p>
          <Button onClick={() => onStartDrill("it is a good day to type fast and accurately", "15s Burst", 15)}>Start Burst</Button>
        </div>
        <div className="bento-card p-6 border-l-4 border-amber-500/50">
          <h3 className="font-semibold mb-2">Threshold Pacing</h3>
          <p className="text-xs opacity-70 mb-4">Sustained moderate speed (60s). Focus on consistent Inter-Keystroke Intervals.</p>
          <Button onClick={() => onStartDrill("sustain a consistent rhythm to ensure neuro-motor noise is minimized", "60s Threshold", 60)}>Start Threshold</Button>
        </div>
      </div>
    </div>
  );
};
