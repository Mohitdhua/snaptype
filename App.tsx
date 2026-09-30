import React, { useState, useEffect, lazy, Suspense } from 'react';
import { SnapTypeApp } from './components/SnapTypeApp';
import { Theme, getStoredTheme, applyTheme } from './services/themeService';

const SnapSpellApp = lazy(() => import('./components/SnapSpellApp').then(m => ({ default: m.SnapSpellApp })));

type AppMode = 'TYPING' | 'SPELLING';

const APP_MODE_KEY = 'snaptype_app_mode_v1';

const getInitialAppMode = (): AppMode => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('app')?.toUpperCase();
    if (modeParam === 'SPELLING' || modeParam === 'TYPING') {
      return modeParam as AppMode;
    }
    const stored = localStorage.getItem(APP_MODE_KEY);
    if (stored === 'SPELLING' || stored === 'TYPING') {
      return stored as AppMode;
    }
  } catch {
    // fallback
  }
  return 'TYPING';
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(getInitialAppMode);
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const switchAppMode = (nextMode: AppMode) => {
    setAppMode(nextMode);
    try {
      localStorage.setItem(APP_MODE_KEY, nextMode);
      const url = new URL(window.location.href);
      url.searchParams.set('app', nextMode.toLowerCase());
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  return (
    <>
      {appMode === 'TYPING' ? (
        <SnapTypeApp
          theme={theme}
          onToggleTheme={toggleTheme}
          onSwitchToSpellingApp={() => switchAppMode('SPELLING')}
        />
      ) : (
        <Suspense fallback={<div className="min-h-screen bg-[#0c1017] flex items-center justify-center text-slate-400 font-mono text-sm">Loading SnapSpell...</div>}>
          <SnapSpellApp
            theme={theme}
            onToggleTheme={toggleTheme}
            onSwitchToTypingApp={() => switchAppMode('TYPING')}
          />
        </Suspense>
      )}
    </>
  );
};

export default App;
