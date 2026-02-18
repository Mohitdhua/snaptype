
import React, { useMemo } from 'react';

interface VirtualKeyboardProps {
    nextChar: string;
    showHands?: boolean;
}

const KEYS = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Space']
];

// Map keys to fingers (0: pinky left, ... 4: thumb, 5: thumb, ... 9: pinky right)
// Simplified color coding
const FINGER_MAP: Record<string, string> = {
    // Left Pinky
    '1': 'bg-red-500', 'q': 'bg-red-500', 'a': 'bg-red-500', 'z': 'bg-red-500', '`': 'bg-red-500', 'tab': 'bg-red-500', 'caps': 'bg-red-500', 'shift': 'bg-red-500',
    // Left Ring
    '2': 'bg-orange-500', 'w': 'bg-orange-500', 's': 'bg-orange-500', 'x': 'bg-orange-500',
    // Left Middle
    '3': 'bg-yellow-500', 'e': 'bg-yellow-500', 'd': 'bg-yellow-500', 'c': 'bg-yellow-500',
    // Left Index
    '4': 'bg-green-500', 'r': 'bg-green-500', 'f': 'bg-green-500', 'v': 'bg-green-500',
    '5': 'bg-green-500', 't': 'bg-green-500', 'g': 'bg-green-500', 'b': 'bg-green-500',
    // Right Index
    '6': 'bg-cyan-500', 'y': 'bg-cyan-500', 'h': 'bg-cyan-500', 'n': 'bg-cyan-500',
    '7': 'bg-cyan-500', 'u': 'bg-cyan-500', 'j': 'bg-cyan-500', 'm': 'bg-cyan-500',
    // Right Middle
    '8': 'bg-blue-500', 'i': 'bg-blue-500', 'k': 'bg-blue-500', ',': 'bg-blue-500',
    // Right Ring
    '9': 'bg-indigo-500', 'o': 'bg-indigo-500', 'l': 'bg-indigo-500', '.': 'bg-indigo-500',
    // Right Pinky
    '0': 'bg-pink-500', 'p': 'bg-pink-500', ';': 'bg-pink-500', '/': 'bg-pink-500',
    '-': 'bg-pink-500', '=': 'bg-pink-500', '[': 'bg-pink-500', ']': 'bg-pink-500', "'": 'bg-pink-500', '\\': 'bg-pink-500', 'backspace': 'bg-pink-500', 'enter': 'bg-pink-500',
    // Thumb
    'space': 'bg-slate-400'
};

const normalizeKey = (key: string) => key.toLowerCase();

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ nextChar }) => {
    const targetKey = useMemo(() => {
        if (nextChar === '\n') return 'enter';
        if (nextChar === ' ') return 'space';
        return normalizeKey(nextChar);
    }, [nextChar]);

    const isShiftNeeded = useMemo(() => {
        return /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(nextChar);
    }, [nextChar]);

    return (
        <div className="w-full mt-3 shrink-0 select-none">
             <div className="w-full overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/90 p-2 md:p-3 shadow-2xl">
             <div className="flex flex-col gap-1 min-w-[700px] md:min-w-[760px]">
                {KEYS.map((row, rIndex) => (
                    <div key={rIndex} className="flex justify-center gap-1">
                        {row.map((key, kIndex) => {
                            const normalizedKey = normalizeKey(key);
                            let isActive = normalizedKey === targetKey;
                            
                            // Handle shift highlighting
                            if (normalizedKey === 'shift' && isShiftNeeded) isActive = true;

                            let width = 'w-8 md:w-10';
                            if (key === 'Backspace') width = 'w-16 md:w-20';
                            if (key === 'Tab') width = 'w-14 md:w-16';
                            if (key === 'Caps') width = 'w-14 md:w-16';
                            if (key === 'Enter') width = 'w-16 md:w-20';
                            if (key === 'Shift') width = 'w-20 md:w-24';
                            if (key === 'Space') width = 'w-44 md:w-64';

                            const baseColor = 'bg-slate-800 text-slate-400 border-slate-700';
                            const activeColor = FINGER_MAP[normalizedKey] 
                                ? `${FINGER_MAP[normalizedKey]} text-white border-white scale-95 shadow-[0_0_10px_rgba(255,255,255,0.3)]` 
                                : 'bg-slate-200 text-slate-900 border-white';

                            // Use unique key by combining key name, row index, and col index
                            const uniqueKey = `${key}-${rIndex}-${kIndex}`;

                            return (
                                <div 
                                    key={uniqueKey} 
                                    className={`
                                        ${width} h-8 md:h-10 rounded-md flex items-center justify-center text-[11px] md:text-xs font-bold border-b-4 transition-all duration-75
                                        ${isActive ? activeColor : baseColor}
                                    `}
                                >
                                    {key === 'Space' ? '' : key}
                                </div>
                            );
                        })}
                    </div>
                ))}
             </div>
             </div>
             <div className="mt-2 text-center text-[10px] text-slate-500 uppercase tracking-widest">
                 Use the highlighted finger
             </div>
        </div>
    );
};
