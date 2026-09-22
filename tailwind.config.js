/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './services/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'stitch-dark': '#0c1017',
        'stitch-panel': '#151b26',
        'stitch-border': '#1e293b',
        'stitch-accent': '#f1f5f9',
        'stitch-muted': '#94a3b8',
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
