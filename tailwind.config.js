/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './services/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'stitch-dark': '#0a0a0a',
        'stitch-panel': '#141414',
        'stitch-border': '#262626',
        'stitch-accent': '#ffffff',
        'stitch-muted': '#a3a3a3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'sans-clean': ['Inter', 'sans-serif'],
        'roboto-mono': ['Roboto Mono', 'monospace'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        courier: ['Courier Prime', 'monospace'],
        jetbrains: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
