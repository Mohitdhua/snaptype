import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { TestResults, TimeLimit } from '../types';
import { levenshteinDistance } from '../utils/stringUtils';

interface PhysicalTypingTestProps {
  ocrText: string;
  imageSrc: string | null;
  referenceText?: string | null;
  timeLimit: TimeLimit;
  onComplete: (results: TestResults) => void;
  onRestart: () => void;
}

export const PhysicalTypingTest: React.FC<PhysicalTypingTestProps> = ({ ocrText, imageSrc, referenceText = null, timeLimit, onComplete, onRestart }) => {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showReference, setShowReference] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef(input);
  const startTimeRef = useRef(startTime);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);

  const finishTest = useCallback((finalTime?: number) => {
      const currentInput = inputRef.current;
      const currentStartTime = startTimeRef.current;

      const endTime = finalTime || (currentStartTime ? (Date.now() - currentStartTime) / 1000 : 0);
      const effectiveTime = Math.max(0.001, endTime);
      const minutes = effectiveTime / 60;

      const cleanInput = currentInput.trim().replace(/\s+/g, ' ');
      const cleanTargetFull = ocrText.trim().replace(/\s+/g, ' ');

      const compareLen = cleanInput.length;
      
      if (compareLen === 0) {
          onComplete({
              netWpm: 0, rawWpm: 0, accuracy: 0, timeElapsed: effectiveTime,
              totalChars: 0, correctChars: 0, incorrectChars: 0,
              hardKeys: {}, missedWords: {}, history: [],
              originalText: '', typedText: currentInput
          });
          return;
      }

      const comparisonTarget = cleanTargetFull.slice(0, compareLen);
      const distance = levenshteinDistance(cleanInput, comparisonTarget);
      const errors = distance;
      const correctChars = Math.max(0, cleanInput.length - errors);
      
      // Calculate Missed Words and Truncate Original Text
      const missedWordsCount: Record<string, number> = {};
      const targetWords = cleanTargetFull.split(/\s+/);
      const inputWords = cleanInput.split(/\s+/);
      
      let inputIdx = 0;
      let lastProcessedTargetIndex = 0;

      for (let i = 0; i < targetWords.length; i++) {
          // Stop if we run out of user input (Cleaner stats for partial tests)
          if (inputIdx >= inputWords.length) {
              break;
          }

          lastProcessedTargetIndex = i;
          const targetWord = targetWords[i];
          
          // Look ahead window of 3 to tolerate skipped words
          let found = false;
          for (let j = 0; j < 3; j++) { 
              if (inputIdx + j < inputWords.length) {
                  if (inputWords[inputIdx + j] === targetWord) {
                      inputIdx += j + 1; // Advance past this word
                      found = true;
                      break;
                  }
              }
          }
          
          if (!found) {
              // Assume word was skipped or substituted
              // Increment missed count
              missedWordsCount[targetWord] = (missedWordsCount[targetWord] || 0) + 1;
              // Advance input index to simulate substitution (one-for-one error)
              // This prevents staying stuck on one input word
              if (inputIdx < inputWords.length) {
                  inputIdx++;
              }
          }
      }

      // Truncate original text to match where the user stopped
      // This ensures the Diff View is clean and doesn't show the untyped rest of the document
      let charLimit = 0;
      let wordCount = 0;
      const targetLimit = lastProcessedTargetIndex + 1;
      
      // Find the character index in raw ocrText corresponding to the last processed word
      // to preserve newlines/formatting in the result
      const matches = ocrText.matchAll(/(\S+)/g);
      for (const match of matches) {
          wordCount++;
          if (wordCount >= targetLimit) {
             charLimit = (match.index || 0) + match[0].length;
             // If user typed MORE than target, we might just show full text
             break;
          }
      }
      // If we processed everything, or input > target, use full length
      if (charLimit === 0 || wordCount < targetLimit) charLimit = ocrText.length;

      const truncatedOriginalRaw = ocrText.slice(0, charLimit);

      const rawWpm = Math.round((currentInput.length / 5) / minutes);
      const netWpm = Math.max(0, Math.round(((currentInput.length - errors) / 5) / minutes));
      const accuracy = Math.max(0, Math.round((correctChars / cleanInput.length) * 100));

      const results: TestResults = {
          netWpm, rawWpm, accuracy, timeElapsed: effectiveTime,
          totalChars: currentInput.length, correctChars, incorrectChars: errors,
          hardKeys: {}, 
          missedWords: missedWordsCount, 
          history: [],
          originalText: truncatedOriginalRaw,
          typedText: currentInput
      };

      onComplete(results);
  }, [ocrText, onComplete]);

  const finishTestRef = useRef(finishTest);
  useEffect(() => { finishTestRef.current = finishTest; }, [finishTest]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1000;
        setElapsed(diff);
        if (timeLimit > 0 && diff >= timeLimit) {
            clearInterval(interval);
            finishTestRef.current(diff);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, timeLimit]);

  useEffect(() => {
      textareaRef.current?.focus();
      return () => {
          if (scrollRafRef.current !== null) {
              cancelAnimationFrame(scrollRafRef.current);
          }
      };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!startTime) setStartTime(Date.now());
    const val = e.target.value;
    setInput(val);

    if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
        if (textareaRef.current && mirrorRef.current) {
            const textarea = textareaRef.current;
            const mirror = mirrorRef.current;
            mirror.style.width = `${textarea.clientWidth}px`;
            const selectionEnd = e.target.selectionEnd;
            const textToCursor = val.substring(0, selectionEnd);
            mirror.textContent = textToCursor.endsWith('\n') ? textToCursor + '\u200b' : textToCursor;
            const targetScroll = mirror.scrollHeight - (textarea.clientHeight / 2);
            textarea.scrollTop = targetScroll;
        }
        scrollRafRef.current = null;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (imageContainerRef.current) {
          const rect = imageContainerRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setMousePos({ x, y });
      }
  };

  const formatTime = (secs: number) => {
      if (timeLimit > 0) {
          const remaining = Math.max(0, timeLimit - secs);
          const m = Math.floor(remaining / 60);
          const s = Math.floor(remaining % 60);
          return `${m}:${s.toString().padStart(2, '0')}`;
      } else {
          const m = Math.floor(secs / 60);
          const s = Math.floor(secs % 60);
          return `${m}:${s.toString().padStart(2, '0')}`;
      }
  };

  const hasReference = Boolean(imageSrc || referenceText);
  const referenceLabel = imageSrc ? 'Reference Image' : 'Reference Text';

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[80vh] animate-fade-in">
        
        {/* Left Side: Image Reference */}
        {hasReference && showReference && (
            <div className="md:w-1/2 h-64 md:h-full transition-all duration-300 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg z-20">
                <div className="p-3 bg-slate-900/80 flex justify-between items-center backdrop-blur-sm border-b border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {referenceLabel}
                    </span>
                    <div className="flex gap-2">
                        {showReference && imageSrc && (
                             <button 
                                onClick={() => setZoomLevel(prev => prev === 1 ? 2.5 : 1)}
                                className={`text-xs px-2 py-1 rounded border ${zoomLevel > 1 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-600 text-slate-400'}`}
                             >
                                {zoomLevel > 1 ? 'Reset Zoom' : 'Zoom In'}
                             </button>
                        )}
                        <button 
                            onClick={() => setShowReference(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
                </div>
                {showReference && imageSrc && (
                    <div 
                        ref={imageContainerRef}
                        className="flex-1 overflow-hidden relative cursor-crosshair bg-black/20"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={() => setZoomLevel(prev => Math.max(prev, 1.01))} // Hint activation
                    >
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <img 
                                src={imageSrc} 
                                alt="Reference" 
                                className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform duration-100 ease-out"
                                style={{ 
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: `${mousePos.x}% ${mousePos.y}%` 
                                }}
                            />
                        </div>
                    </div>
                )}
                {showReference && !imageSrc && referenceText && (
                    <div className="flex-1 overflow-auto p-4 bg-slate-900/30">
                        <pre className="whitespace-pre-wrap break-words text-sm md:text-base font-mono text-slate-300 leading-relaxed">
                            {referenceText}
                        </pre>
                    </div>
                )}
            </div>
        )}
        {hasReference && !showReference && (
            <button
                type="button"
                onClick={() => setShowReference(true)}
                className="shrink-0 self-start md:self-start mt-1 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/60 rounded-xl px-3 py-2 shadow-lg transition-colors flex items-center gap-2"
                title={`Open ${referenceLabel}`}
            >
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-wider">Open Reference</span>
            </button>
        )}

        {/* Right Side: Typing Area */}
        <div className="flex-1 flex flex-col h-full gap-4">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                     <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                     </div>
                     <div>
                         <div className="text-xs text-slate-500 uppercase font-bold">Physical Mode</div>
                         <div className="text-slate-300 text-sm">Read from paper/image, type here</div>
                     </div>
                </div>
                <div className="text-2xl font-mono font-bold text-slate-200">
                    {formatTime(elapsed)}
                </div>
             </div>

            <div className="relative flex-1 w-full min-h-0">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 text-lg md:text-xl font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none shadow-inner leading-relaxed transition-all caret-indigo-500 overflow-y-auto"
                    placeholder="Start typing what you see on the page..."
                    spellCheck={false}
                />
                
                {/* Mirror Div for Scroll Calculation */}
                <div 
                    ref={mirrorRef}
                    className="absolute top-0 left-0 -z-50 invisible p-6 md:p-8 text-lg md:text-xl font-mono leading-relaxed border border-transparent whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
                    aria-hidden="true"
                />
            </div>

            <div className="flex gap-4">
                <Button onClick={() => finishTest()} className="flex-1" variant="primary">
                    Finish Test & Analyze
                </Button>
                <Button onClick={onRestart} variant="secondary">
                    Cancel
                </Button>
            </div>
        </div>
    </div>
  );
};
