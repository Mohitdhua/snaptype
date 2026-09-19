import React, { useMemo, useState, useEffect } from 'react';
import { FINGER_MAP, FingerId } from './HandsGuide';

export type KeyboardLayout = 'QWERTY' | 'MANGAL_INSCRIPT' | 'KRUTIDEV';

interface VirtualKeyboardProps {
  nextChar: string;
  initialLayout?: KeyboardLayout;
}

const HINDI_INSCRIPT_MAP: Record<string, string> = {
  'q': 'ौ', 'w': 'ै', 'e': 'ा', 'r': 'ी', 't': 'ू', 'y': 'ब', 'u': 'ह', 'i': 'ग', 'o': 'द', 'p': 'ज', '[': 'ड', ']': '़',
  'a': 'ो', 's': 'े', 'd': '्', 'f': 'ि', 'g': 'ु', 'h': 'प', 'j': 'र', 'k': 'क', 'l': 'त', ';': 'च', "'": 'ट',
  'z': '्र', 'x': 'ं', 'c': 'म', 'v': 'न', 'b': 'व', 'n': 'ल', 'm': 'स', ',': ',', '.': '.', '/': 'य'
};

const KRUTIDEV_MAP: Record<string, string> = {
  'q': 'ु', 'w': 'ू', 'e': 'म', 'r': 'त', 't': 'ज', 'y': 'ल', 'u': 'न', 'i': 'प', 'o': 'व', 'p': 'च',
  'a': 'ं', 's': 'े', 'd': 'क', 'f': 'ि', 'g': 'ह', 'h': 'ी', 'j': 'र', 'k': 'ा', 'l': 'स', ';': 'य',
  'z': '्र', 'x': 'ग', 'c': 'ब', 'v': 'अ', 'b': 'इ', 'n': 'द', 'm': 'उ'
};

const KEYS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Space']
];

const FINGER_COLORS: Record<FingerId, string> = {
  lp: '#ec4899', // pink-500
  lr: '#f97316', // orange-500
  lm: '#eab308', // amber-500
  li: '#10b981', // emerald-500
  thumb: '#6366f1', // indigo-500
  ri: '#06b6d4', // cyan-500
  rm: '#3b82f6', // blue-500
  rr: '#8b5cf6', // violet-500
  rp: '#f43f5e', // rose-500
};

// Sub-labels for number and symbol keys
const SUB_LABELS: Record<string, string> = {
  '`': '~',
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')',
  '-': '_',
  '=': '+',
  '[': '{',
  ']': '}',
  '\\': '|',
  ';': ':',
  "'": '"',
  ',': '<',
  '.': '>',
  '/': '?',
};

// Map character to physical key identifier
const CHAR_TO_KEY: Record<string, string> = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
};

const normalizeKey = (key: string) => key.toLowerCase();

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ nextChar, initialLayout = 'QWERTY' }) => {
  const [activePhysicalKey, setActivePhysicalKey] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [layout, setLayout] = useState<KeyboardLayout>(initialLayout);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let key = e.key.toLowerCase();
      if (key === ' ') key = 'space';
      setActivePhysicalKey(key);
    };

    const handleKeyUp = () => {
      setActivePhysicalKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const targetKey = useMemo(() => {
    if (nextChar === '\n') return 'enter';
    if (nextChar === ' ') return 'space';
    if (CHAR_TO_KEY[nextChar]) return normalizeKey(CHAR_TO_KEY[nextChar]);
    return normalizeKey(nextChar);
  }, [nextChar]);

  const isShiftNeeded = useMemo(() => {
    return /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(nextChar);
  }, [nextChar]);

  const formattedTargetLabel = useMemo(() => {
    if (!nextChar) return 'None';
    if (nextChar === ' ') return 'Space';
    if (nextChar === '\n') return 'Enter';
    return nextChar;
  }, [nextChar]);

  return (
    <div className="w-full mt-3 shrink-0 select-none transition-all duration-200">
      <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-neutral-950/75 backdrop-blur-xl p-3 shadow-2xl">
        <div className="flex flex-col gap-1.5 min-w-[700px] md:min-w-[760px] mx-auto w-fit">
          {KEYS.map((row, rIndex) => (
            <div key={rIndex} className="flex justify-center gap-1.5">
              {row.map((key, kIndex) => {
                const normalizedKey = normalizeKey(key);
                let isTarget = normalizedKey === targetKey;
                const isShiftKey = normalizedKey === 'shift' && isShiftNeeded;
                if (isShiftKey) isTarget = true;

                const isPhysicalPressed = normalizedKey === activePhysicalKey;

                let width = 'w-8 md:w-10';
                if (key === 'Backspace') width = 'w-16 md:w-20';
                if (key === 'Tab') width = 'w-14 md:w-16';
                if (key === 'Caps') width = 'w-14 md:w-16';
                if (key === 'Enter') width = 'w-16 md:w-20';
                if (key === 'Shift') width = 'w-20 md:w-24';
                if (key === 'Space') width = 'w-48 md:w-72';

                const subLabel = SUB_LABELS[key];
                const hindiChar = layout === 'MANGAL_INSCRIPT'
                  ? HINDI_INSCRIPT_MAP[normalizedKey]
                  : layout === 'KRUTIDEV'
                  ? KRUTIDEV_MAP[normalizedKey]
                  : undefined;

                const uniqueKey = `${key}-${rIndex}-${kIndex}`;

                const fingerId = FINGER_MAP[normalizedKey] || (subLabel ? FINGER_MAP[subLabel] : undefined);
                const fingerColor = fingerId ? FINGER_COLORS[fingerId] : undefined;

                return (
                  <div
                    key={uniqueKey}
                    style={{
                      borderBottomColor: showZones && fingerColor && !isTarget ? fingerColor : undefined,
                      borderBottomWidth: showZones && fingerColor ? '2.5px' : undefined,
                    }}
                    className={`
                      ${width} h-9 md:h-11 rounded-lg flex flex-col items-center justify-center font-mono transition-all duration-75 relative
                      ${
                        isTarget
                          ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-bold border-t border-indigo-400 shadow-[0_0_18px_rgba(99,102,241,0.55),0_2px_0_0_#3730a3] scale-[0.97]'
                          : isPhysicalPressed
                          ? 'bg-neutral-800 text-white border-neutral-700 shadow-inner translate-y-0.5 scale-[0.95]'
                          : 'bg-neutral-900/90 hover:bg-neutral-800/90 text-neutral-400 border border-neutral-800 shadow-[0_2.5px_0_0_#141414]'
                      }
                    `}
                  >
                    {hindiChar ? (
                      <span className="text-[10px] md:text-[11px] font-bold text-amber-300 font-sans -mb-0.5">
                        {hindiChar}
                      </span>
                    ) : subLabel ? (
                      <span className={`text-[8px] md:text-[9px] -mb-1 ${isTarget ? 'text-indigo-200' : 'text-neutral-500'}`}>
                        {subLabel}
                      </span>
                    ) : null}
                    <span className="text-[11px] md:text-xs tracking-tight font-medium">
                      {key === 'Space' ? '—' : key}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Status & Layout Switcher Bar */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-3 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-neutral-400 font-mono">
              Target Key: <span className="text-white font-bold px-1.5 py-0.5 rounded bg-white/10 border border-white/10">{formattedTargetLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard Layout Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setLayout('QWERTY')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${layout === 'QWERTY' ? 'bg-white/20 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
              >
                ENG
              </button>
              <button
                onClick={() => setLayout('MANGAL_INSCRIPT')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${layout === 'MANGAL_INSCRIPT' ? 'bg-indigo-500/40 text-indigo-200 font-bold' : 'text-neutral-400 hover:text-white'}`}
                title="Mangal Inscript (SSC/Govt)"
              >
                मंगल (Inscript)
              </button>
              <button
                onClick={() => setLayout('KRUTIDEV')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${layout === 'KRUTIDEV' ? 'bg-amber-500/40 text-amber-200 font-bold' : 'text-neutral-400 hover:text-white'}`}
                title="KrutiDev 010 (High Court)"
              >
                कृतिदेव (KrutiDev)
              </button>
            </div>

            <button
              onClick={() => setShowZones(prev => !prev)}
              className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              {showZones ? 'Hide Zones' : 'Show Zones'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

