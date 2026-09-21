import React, { useMemo } from 'react';

interface HandsGuideProps {
  nextChar: string;
  focusHand?: 'left' | 'right';
}

export type FingerId = 'lp' | 'lr' | 'lm' | 'li' | 'thumb' | 'ri' | 'rm' | 'rr' | 'rp';

export const FINGER_MAP: Record<string, FingerId> = {
  // Left Pinky
  '`': 'lp', '~': 'lp', '1': 'lp', '!': 'lp', 'q': 'lp', 'a': 'lp', 'z': 'lp', 'tab': 'lp', 'caps': 'lp',
  // Left Ring
  '2': 'lr', '@': 'lr', 'w': 'lr', 's': 'lr', 'x': 'lr',
  // Left Middle
  '3': 'lm', '#': 'lm', 'e': 'lm', 'd': 'lm', 'c': 'lm',
  // Left Index
  '4': 'li', '$': 'li', '5': 'li', '%': 'li', 'r': 'li', 't': 'li', 'f': 'li', 'g': 'li', 'v': 'li', 'b': 'li',
  // Thumbs
  ' ': 'thumb', 'space': 'thumb',
  // Right Index
  '6': 'ri', '^': 'ri', '7': 'ri', '&': 'ri', 'y': 'ri', 'u': 'ri', 'h': 'ri', 'j': 'ri', 'n': 'ri', 'm': 'ri',
  // Right Middle
  '8': 'rm', '*': 'rm', 'i': 'rm', 'k': 'rm', ',': 'rm', '<': 'rm',
  // Right Ring
  '9': 'rr', '(': 'rr', 'o': 'rr', 'l': 'rr', '.': 'rr', '>': 'rr',
  // Right Pinky
  '0': 'rp', ')': 'rp', '-': 'rp', '_': 'rp', '=': 'rp', '+': 'rp',
  'p': 'rp', '[': 'rp', '{': 'rp', ']': 'rp', '}': 'rp', '\\': 'rp', '|': 'rp',
  ';': 'rp', ':': 'rp', "'": 'rp', '"': 'rp', '/': 'rp', '?': 'rp',
  'enter': 'rp', '\n': 'rp', 'backspace': 'rp',
};

const FINGER_NAMES: Record<FingerId, string> = {
  lp: 'Left Pinky',
  lr: 'Left Ring Finger',
  lm: 'Left Middle Finger',
  li: 'Left Index Finger',
  thumb: 'Thumb (Spacebar)',
  ri: 'Right Index Finger',
  rm: 'Right Middle Finger',
  rr: 'Right Ring Finger',
  rp: 'Right Pinky',
};

export const HandsGuide: React.FC<HandsGuideProps> = ({ nextChar, focusHand }) => {
  const activeFinger = useMemo<FingerId | null>(() => {
    if (!nextChar) return null;
    const lower = nextChar.toLowerCase();
    return FINGER_MAP[lower] || FINGER_MAP[nextChar] || null;
  }, [nextChar]);

  const fingerLabel = activeFinger ? FINGER_NAMES[activeFinger] : 'Home Row Position';

  const isShiftNeeded = useMemo(() => {
    return /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(nextChar);
  }, [nextChar]);

  const isRightHandFocused = focusHand === 'right';

  const getFingerClass = (id: FingerId) => {
    const isActive = activeFinger === id;
    if (isActive) {
      if (isRightHandFocused && (id === 'ri' || id === 'rm' || id === 'rr' || id === 'rp')) {
        return 'fill-cyan-400 stroke-cyan-200 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.9)] transition-all duration-100';
      }
      return 'fill-indigo-500 stroke-indigo-300 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-100';
    }
    return 'fill-neutral-900 stroke-neutral-700/80 transition-all duration-150';
  };

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-1">
      {/* Active Finger Status Bar */}
      <div className="flex items-center gap-2 mb-2 text-xs font-mono">
        <span className="text-neutral-400">Finger:</span>
        <span className={`font-bold px-2 py-0.5 rounded-lg border transition-all ${
          isRightHandFocused
            ? 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
            : 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30'
        }`}>
          {fingerLabel}
        </span>
        {isRightHandFocused && (
          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 rounded-full animate-pulse">
            ✋ Right Hand Focus Mode
          </span>
        )}
        {isShiftNeeded && (
          <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
            + Hold Shift
          </span>
        )}
      </div>

      {/* Stylized Hands Diagram */}
      <div className="flex items-center justify-center gap-8 md:gap-16 w-full max-w-md">
        {/* Left Hand */}
        <div className={`flex flex-col items-center transition-opacity duration-300 ${isRightHandFocused ? 'opacity-35' : 'opacity-100'}`}>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Left Hand</span>
          <svg className="w-28 md:w-36 h-20" viewBox="0 0 160 100" fill="none">
            {/* Palm */}
            <path
              d="M30 65 C30 50, 130 50, 130 65 C130 95, 30 95, 30 65 Z"
              className="fill-neutral-950/80 stroke-neutral-800"
              strokeWidth="2"
            />
            {/* Pinky (lp) */}
            <rect x="25" y="25" width="16" height="42" rx="8" className={getFingerClass('lp')} strokeWidth="2" />
            {/* Ring (lr) */}
            <rect x="47" y="15" width="16" height="52" rx="8" className={getFingerClass('lr')} strokeWidth="2" />
            {/* Middle (lm) */}
            <rect x="69" y="8" width="16" height="59" rx="8" className={getFingerClass('lm')} strokeWidth="2" />
            {/* Index (li) */}
            <rect x="91" y="15" width="16" height="52" rx="8" className={getFingerClass('li')} strokeWidth="2" />
            {/* Thumb (thumb) */}
            <rect x="116" y="45" width="28" height="18" rx="9" className={getFingerClass('thumb')} strokeWidth="2" />
          </svg>
          <div className="flex gap-2 text-[9px] font-mono text-neutral-500 mt-1">
            <span className={activeFinger === 'lp' ? 'text-indigo-400 font-bold' : ''}>A</span>
            <span className={activeFinger === 'lr' ? 'text-indigo-400 font-bold' : ''}>S</span>
            <span className={activeFinger === 'lm' ? 'text-indigo-400 font-bold' : ''}>D</span>
            <span className={activeFinger === 'li' ? 'text-indigo-400 font-bold' : ''}>F</span>
          </div>
        </div>

        {/* Right Hand */}
        <div className={`flex flex-col items-center transition-all duration-300 ${isRightHandFocused ? 'scale-105' : ''}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
            isRightHandFocused ? 'text-cyan-400 font-extrabold drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-neutral-500'
          }`}>
            Right Hand {isRightHandFocused && '⚡'}
          </span>
          <svg className="w-28 md:w-36 h-20" viewBox="0 0 160 100" fill="none">
            {/* Palm */}
            <path
              d="M30 65 C30 50, 130 50, 130 65 C130 95, 30 95, 30 65 Z"
              className={isRightHandFocused ? 'fill-neutral-950/90 stroke-cyan-500/50 shadow-cyan' : 'fill-neutral-950/80 stroke-neutral-800'}
              strokeWidth="2"
            />
            {/* Thumb (thumb) */}
            <rect x="16" y="45" width="28" height="18" rx="9" className={getFingerClass('thumb')} strokeWidth="2" />
            {/* Index (ri) */}
            <rect x="53" y="15" width="16" height="52" rx="8" className={getFingerClass('ri')} strokeWidth="2" />
            {/* Middle (rm) */}
            <rect x="75" y="8" width="16" height="59" rx="8" className={getFingerClass('rm')} strokeWidth="2" />
            {/* Ring (rr) */}
            <rect x="97" y="15" width="16" height="52" rx="8" className={getFingerClass('rr')} strokeWidth="2" />
            {/* Pinky (rp) */}
            <rect x="119" y="25" width="16" height="42" rx="8" className={getFingerClass('rp')} strokeWidth="2" />
          </svg>
          <div className="flex gap-2 text-[9px] font-mono text-neutral-500 mt-1">
            <span className={activeFinger === 'ri' ? 'text-cyan-400 font-bold' : ''}>J</span>
            <span className={activeFinger === 'rm' ? 'text-cyan-400 font-bold' : ''}>K</span>
            <span className={activeFinger === 'rr' ? 'text-cyan-400 font-bold' : ''}>L</span>
            <span className={activeFinger === 'rp' ? 'text-cyan-400 font-bold' : ''}>;</span>
          </div>
        </div>
      </div>
    </div>
  );
};
