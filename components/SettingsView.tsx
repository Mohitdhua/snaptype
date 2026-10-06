import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { TimeLimit, HardcoreMode } from '../types';
import { getDefaultTimeLimit, setDefaultTimeLimit } from '../services/storageService';
import { getSoundProfile, setSoundProfile, SoundProfile, playKeystrokeSound } from '../services/soundService';
import { Theme } from '../services/themeService';

interface SettingsViewProps {
  theme: Theme;
  onToggleTheme: () => void;
  onSwitchToSpellingApp: () => void;
  currentHardcoreMode: HardcoreMode;
  onSetHardcoreMode: (mode: HardcoreMode) => void;
  onDefaultTimeLimitChange: (limit: TimeLimit) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  onSwitchToSpellingApp,
  currentHardcoreMode,
  onSetHardcoreMode,
  onDefaultTimeLimitChange
}) => {
  const [selectedTimeLimit, setSelectedTimeLimit] = useState<TimeLimit>(getDefaultTimeLimit);
  const [soundProfile, setSoundProfileState] = useState<SoundProfile>(getSoundProfile);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const timeOptions: { label: string; value: TimeLimit; desc: string }[] = [
    { label: '15s', value: 15, desc: 'High-cadence burst' },
    { label: '30s', value: 30, desc: 'Quick diagnostic' },
    { label: '60s', value: 60, desc: '1-minute standard' },
    { label: '120s', value: 120, desc: '2-minute endurance' },
    { label: '300s', value: 300, desc: '5-minute pacing' },
    { label: '600s', value: 600, desc: '10-minute SSC/Govt exam' },
    { label: 'Unlimited', value: 0, desc: 'Finish entire text' },
  ];

  const soundOptions: { label: string; value: SoundProfile; desc: string }[] = [
    { label: 'Cherry MX Blue', value: 'cherry-blue', desc: 'Crisp tactile click' },
    { label: 'Cherry MX Brown', value: 'cherry-brown', desc: 'Dampened mechanical punch' },
    { label: 'Topre', value: 'topre', desc: 'Thock capacitive dome' },
    { label: 'Typewriter', value: 'typewriter', desc: 'Vintage iron strike' },
    { label: 'Soft Membrane', value: 'soft', desc: 'Subtle cushioned sound' },
    { label: 'Muted', value: 'off', desc: 'Silent mode' },
  ];

  const hardcoreOptions: { label: string; value: HardcoreMode; desc: string }[] = [
    { label: 'Standard', value: 'NONE', desc: 'Backspace correction allowed' },
    { label: 'No Backspace', value: 'NO_BACKSPACE', desc: 'Strict neuromuscular accuracy (errors stay)' },
    { label: 'Sudden Death', value: 'SUDDEN_DEATH', desc: 'Single typo instantly ends test' },
    { label: 'Stop On Error', value: 'STOP_ON_ERROR', desc: 'Forces fixing the exact typo before advancing' },
  ];

  const handleSelectTimeLimit = (val: TimeLimit) => {
    setSelectedTimeLimit(val);
    setDefaultTimeLimit(val);
    onDefaultTimeLimitChange(val);
    showNotice(`Default test time set to ${val === 0 ? 'Unlimited' : `${val}s`}`);
  };

  const handleSelectSound = (val: SoundProfile) => {
    setSoundProfileState(val);
    setSoundProfile(val);
    if (val !== 'off') {
      playKeystrokeSound(val);
    }
    showNotice(`Acoustic profile set to ${val}`);
  };

  const handleSelectHardcore = (val: HardcoreMode) => {
    onSetHardcoreMode(val);
    showNotice(`Typing mode updated`);
  };

  const showNotice = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in pb-16 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
              Global Preferences
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System & Engine Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Configured globally across all typing sessions, tests, and drills.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
            <span>✓</span>
            <span>{savedMessage}</span>
          </div>
        )}
      </div>

      {/* 1. Global Default Typing Test Duration */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>⏱️</span>
              <span>Default Typing Test Duration</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              The time limit automatically assigned to all standard typing tests, custom uploads, and practice passages.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            Current: {selectedTimeLimit === 0 ? 'Unlimited' : `${selectedTimeLimit} seconds`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {timeOptions.map(opt => {
            const isSelected = selectedTimeLimit === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectTimeLimit(opt.value)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold scale-[1.02] keep-white'
                    : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-white/10'
                }`}
              >
                <span className="text-sm font-mono font-extrabold">{opt.label}</span>
                <span className={`text-[9px] mt-1 line-clamp-1 ${isSelected ? 'text-indigo-100 keep-white' : 'text-slate-400 dark:text-neutral-400'}`}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Mechanical Keyboard Acoustic Synthesizer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🔊</span>
              <span>Acoustic Feedback (Mechanical Audio Engine)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Zero-latency synthesized audio modeled after physical switch actuators.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10">
            {soundProfile.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          {soundOptions.map(opt => {
            const isSelected = soundProfile === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectSound(opt.value)}
                className={`p-3 rounded-xl border flex flex-col text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                    : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-white/10'
                }`}
              >
                <span className="text-xs font-bold font-mono">{opt.label}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100 keep-white' : 'text-slate-400 dark:text-neutral-400'}`}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Motor Accuracy Discipline (Hardcore Mode) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>Motor Discipline & Error Penalty</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Science-backed training constraint: Disabling backspacing forces deliberate sensory processing and eliminates impulsive typos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {hardcoreOptions.map(opt => {
            const isSelected = currentHardcoreMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleSelectHardcore(opt.value)}
                className={`p-3.5 rounded-xl border flex flex-col text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm keep-white'
                    : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{opt.label}</span>
                  {isSelected && <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded keep-white">ACTIVE</span>}
                </div>
                <span className={`text-[11px] mt-1 ${isSelected ? 'text-indigo-100 keep-white' : 'text-slate-400 dark:text-neutral-400'}`}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Display & System Utilities */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#141a24] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎨</span>
            <span>Interface Theme & App Switcher</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Active theme: <strong className="capitalize">{theme}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={onToggleTheme}
            className="flex-1 sm:flex-initial bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 font-bold px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/10"
          >
            {theme === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
          </Button>

          <Button
            onClick={onSwitchToSpellingApp}
            className="flex-1 sm:flex-initial bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-4 py-2.5 text-xs rounded-xl shadow-md keep-white"
          >
            Switch to SnapSpell
          </Button>
        </div>
      </div>
    </div>
  );
};
