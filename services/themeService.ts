export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'snaptype_theme_v1';

export const getStoredTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // Fallback to dark mode on error or SSR
  }
  return 'dark';
};

export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    body.classList.remove('dark');
    body.classList.add('light');
    root.setAttribute('data-theme', 'light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    body.classList.remove('light');
    body.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  }

  // Update mobile browser chrome / theme-color meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0a0a');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage quota errors
  }

  // Broadcast change for non-React or cross-component listeners
  window.dispatchEvent(new CustomEvent('snaptype-theme-change', { detail: { theme } }));
};
