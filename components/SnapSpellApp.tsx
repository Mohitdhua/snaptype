import React, { useState } from 'react';
import { SpellingQuizView } from './SpellingQuizView';

interface SnapSpellAppProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchToTypingApp: () => void;
}

export const SnapSpellApp: React.FC<SnapSpellAppProps> = ({
  theme,
  onToggleTheme,
  onSwitchToTypingApp
}) => {
  return (
    <div className={`min-h-screen font-sans relative transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#0c1017] text-slate-100'
    }`}>
      <div className="mesh-bg" />

      {/* Top Standalone Header for SnapSpell */}
      <header className="fixed top-0 left-0 right-0 p-3 md:p-4 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 pointer-events-auto items-center">
          <div className={`flex items-center justify-between w-full max-w-5xl px-4 md:px-6 py-2.5 rounded-2xl md:rounded-full backdrop-blur-xl border transition-all duration-200 ${
            theme === 'light'
              ? 'bg-white/95 border-slate-200/90 shadow-lg shadow-slate-200/40 text-slate-900'
              : 'bg-[#131924]/90 border-white/10 shadow-2xl text-slate-100'
          }`}>
            {/* SnapSpell Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
                <span className="text-white font-black text-lg leading-none keep-white">🗣️</span>
              </div>
              <div className="text-left">
                <div className={`text-base font-black tracking-tight leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  SnapSpell
                </div>
                <div className="text-[10px] font-mono text-indigo-400 font-semibold leading-none">
                  Audio Spelling Master
                </div>
              </div>
            </div>

            {/* App Switcher & Theme Control */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onSwitchToTypingApp}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all shadow-xs"
                title="Switch to SnapType Blind Typing Master"
              >
                <span>⌨️</span>
                <span className="hidden sm:inline">Switch to SnapType</span>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
                }`}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Light/Dark Theme"
              >
                <span className="text-xs leading-none">{theme === 'dark' ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main SnapSpell Content Area */}
      <main className="container mx-auto px-4 pb-12 min-h-screen flex flex-col items-center justify-start pt-24 md:pt-28 relative z-10">
        <SpellingQuizView theme={theme} />
      </main>

      <footer className="fixed bottom-3 right-4 text-[10px] font-mono text-neutral-500 pointer-events-none">
        SnapSpell Audio Engine • Neural TTS Calibrated
      </footer>
    </div>
  );
};
