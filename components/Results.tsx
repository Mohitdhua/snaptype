
import React, { useMemo, useEffect, useState } from 'react';
import { Button } from './Button';
import { TestResults, GameMode, StoredResult } from '../types';
import { getHistory } from '../services/storageService';
import { ProgressChart } from './ProgressChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { playSound } from '../services/soundService';

interface ResultsProps {
  results: TestResults;
  mode: GameMode;
  onReset: () => void;
  onNewImage: () => void;
  onPractice: (type: 'words' | 'keys') => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-slate-400 text-xs font-bold mb-1">{`Time: ${label}s`}</p>
        <p className="text-indigo-400 text-sm font-bold">{`WPM: ${payload[0]?.value}`}</p>
        {payload[1] && (
             <p className="text-slate-500 text-xs">{`Raw: ${payload[1]?.value}`}</p>
        )}
        <p className="text-emerald-400 text-xs">{`Acc: ${payload[0]?.payload.accuracy}%`}</p>
      </div>
    );
  }
  return null;
};

// Digital Mode: Unified Diff
const TextDiffView = ({ original, typed }: { original: string, typed: string }) => {
    const diff = useMemo(() => {
        const wordsOrig = original.split(/(\s+)/);
        const wordsTyped = typed.split(/(\s+)/);
        
        const chunks: React.ReactNode[] = [];
        let i = 0; 
        let j = 0; 

        while (i < wordsOrig.length || j < wordsTyped.length) {
            const wo = wordsOrig[i];
            const wt = wordsTyped[j];

            if (wo === wt) {
                chunks.push(<span key={`${i}-${j}`} className="text-slate-400">{wo}</span>);
                i++; j++;
            } else {
                if (wo && wt) {
                     chunks.push(
                        <span key={`sub-${i}-${j}`} className="inline-block mx-0.5">
                            <span className="line-through text-slate-600 opacity-50 text-[0.8em]">{wo}</span>
                            <span className="text-rose-400 bg-rose-500/10 rounded px-0.5">{wt}</span>
                        </span>
                    );
                    i++; j++;
                } else if (wo) {
                    chunks.push(<span key={`del-${i}`} className="text-amber-500/50 line-through decoration-amber-500/50">{wo}</span>);
                    i++;
                } else if (wt) {
                    chunks.push(<span key={`ins-${j}`} className="text-rose-400 bg-rose-500/10 rounded px-0.5">{wt}</span>);
                    j++;
                }
            }
        }
        return chunks;
    }, [original, typed]);

    return (
        <div className="w-full bg-slate-900 rounded-xl p-6 font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner max-h-96 overflow-y-auto">
            {diff}
        </div>
    );
};

// Physical Mode: Split Diff with Common Scrollbar
const SplitTextDiffView = ({ original, typed }: { original: string, typed: string }) => {
    const { left, right } = useMemo(() => {
        const wordsOrig = original.split(/(\s+)/);
        const wordsTyped = typed.split(/(\s+)/);
        
        const leftChunks: React.ReactNode[] = [];
        const rightChunks: React.ReactNode[] = [];
        let i = 0; 
        let j = 0; 

        while (i < wordsOrig.length || j < wordsTyped.length) {
            const wo = wordsOrig[i] || '';
            const wt = wordsTyped[j] || '';

            // Handle whitespaces
            if (wo.match(/^\s+$/) && wt.match(/^\s+$/)) {
                 leftChunks.push(<span key={`l-${i}`}>{wo}</span>);
                 rightChunks.push(<span key={`r-${j}`}>{wt}</span>);
                 i++; j++;
                 continue;
            }

            if (wo === wt) {
                // Match
                leftChunks.push(<span key={`l-${i}`} className="text-slate-400">{wo}</span>);
                rightChunks.push(<span key={`r-${j}`} className="text-slate-400">{wt}</span>);
                i++; j++;
            } else {
                // Mismatch
                if (wo && wt) {
                     // Substitution
                     leftChunks.push(<span key={`l-sub-${i}`} className="text-amber-500 bg-amber-500/10 rounded px-0.5 font-bold">{wo}</span>);
                     rightChunks.push(<span key={`r-sub-${j}`} className="text-rose-400 bg-rose-500/10 rounded px-0.5 font-bold">{wt}</span>);
                     i++; j++;
                } else if (wo) {
                    // Deletion (User missed this word)
                    leftChunks.push(<span key={`l-del-${i}`} className="text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-0.5 font-bold">{wo}</span>);
                    i++;
                } else if (wt) {
                    // Insertion (User typed extra)
                    rightChunks.push(<span key={`r-ins-${j}`} className="text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-0.5 font-bold">{wt}</span>);
                    j++;
                }
            }
        }
        return { left: leftChunks, right: rightChunks };
    }, [original, typed]);

    return (
        <div className="flex flex-col h-96 bg-slate-900 rounded-xl border border-slate-800 shadow-inner overflow-hidden">
             <div className="grid grid-cols-2 bg-slate-950/30 border-b border-slate-800 p-3">
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-wider text-center">Original Text</div>
                 <div className="text-slate-500 text-xs font-bold uppercase tracking-wider text-center">You Typed</div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 min-h-full">
                    <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words border-r border-slate-800/50">
                        {left}
                    </div>
                    <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {right}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Results: React.FC<ResultsProps> = ({ results, mode, onReset, onNewImage, onPractice }) => {
  const [history, setHistory] = useState<StoredResult[]>([]);

  useEffect(() => {
      setHistory(getHistory());
      // Play badge unlock sound if any
      if ((results.badgesUnlocked && results.badgesUnlocked.length > 0) || (results.isSSC && (results.sscMarks || 0) > 0)) {
          const timeoutId = setTimeout(() => playSound('success'), 500);
          return () => clearTimeout(timeoutId);
      }
      return undefined;
  }, [results]);

  // Sort hard keys by frequency
  const topHardKeys = Object.entries(results.hardKeys)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 8);

  const topMissedWords = Object.entries(results.missedWords || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 12);

  const sessionChartData = results.history || [];

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center animate-scale-in pb-12">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-8">
            Session Report
        </h2>

        {/* Badge / XP Notification */}
        {(results.badgesUnlocked && results.badgesUnlocked.length > 0) || results.xpGained ? (
            <div className="w-full mb-8 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                        <div className="text-indigo-300 font-bold">Session Complete!</div>
                        <div className="text-indigo-200 text-sm">You earned <span className="font-bold text-white">+{results.xpGained || 0} XP</span></div>
                    </div>
                </div>
                {results.badgesUnlocked && results.badgesUnlocked.length > 0 && (
                     <div className="flex gap-2">
                        {results.badgesUnlocked.map(badge => (
                            <div key={badge.id} className="flex items-center gap-2 bg-indigo-600 px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                <span className="text-lg">{badge.icon}</span>
                                <span className="text-white font-bold text-sm">{badge.name} Unlocked!</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : null}
        
        {/* SSC Mode Scorecard */}
        {results.isSSC && (
            <div className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">SSC MODE</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Total Strokes</div>
                        <div className="text-3xl font-mono text-white">{results.totalChars}</div>
                        <div className="text-xs text-slate-500 mt-1">Words: {Math.round(results.totalChars / 5)}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-xl">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Mistakes Penalty</div>
                        <div className="text-3xl font-mono text-rose-400">-{results.incorrectChars} <span className="text-sm">WPM</span></div>
                        <div className="text-xs text-slate-500 mt-1">1 WPM per mistake</div>
                    </div>
                     <div className="flex flex-col items-center justify-center p-4 bg-slate-900/50 rounded-xl border-2 border-indigo-500/30">
                        <div className="text-xs text-indigo-400 uppercase font-bold mb-1">Marks Obtained</div>
                        <div className="text-4xl font-mono font-black text-white">{results.sscMarks || 0}<span className="text-lg text-slate-500 font-normal">/25</span></div>
                        <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded ${results.netWpm >= 30 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {results.netWpm >= 30 ? 'QUALIFIED' : 'DISQUALIFIED'}
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-center text-xs text-slate-500">
                    Formula: (Strokes / 5) / Time - Mistakes = Net Speed
                </div>
            </div>
        )}

        {/* Main Stats (Standard view, hidden details in SSC mode if cleaner look desired, but kept for consistency) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center py-8 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span className="text-indigo-400 font-black text-6xl mb-1">{results.netWpm}</span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">{results.isSSC ? 'Actual Speed' : 'Net WPM'}</span>
                <span className="text-slate-500 text-xs mt-2">{results.isSSC ? 'After penalty' : 'Adjusted speed'}</span>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center py-8 shadow-lg">
                <span className="text-slate-300 font-bold text-4xl mb-2">{results.rawWpm}</span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">{results.isSSC ? 'Tentative Speed' : 'Raw WPM'}</span>
                 <span className="text-slate-500 text-xs mt-2">Uncorrected speed</span>
            </div>

             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center py-8 shadow-lg">
                <span className={`${results.accuracy > 95 ? 'text-emerald-400' : 'text-amber-400'} font-bold text-4xl mb-2`}>{results.accuracy}%</span>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accuracy</span>
                 <span className="text-slate-500 text-xs mt-2">{results.incorrectChars} errors</span>
            </div>

             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center py-8 shadow-lg">
                <div className="flex gap-4 items-end mb-2">
                    <div className="flex flex-col items-center">
                         <span className="text-emerald-400 font-bold text-2xl">{results.correctChars}</span>
                         <span className="text-[10px] text-slate-500 uppercase">Correct</span>
                    </div>
                    <div className="h-8 w-px bg-slate-700"></div>
                     <div className="flex flex-col items-center">
                         <span className="text-rose-400 font-bold text-2xl">{results.incorrectChars}</span>
                         <span className="text-[10px] text-slate-500 uppercase">Incorrect</span>
                    </div>
                </div>
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Keystrokes</span>
            </div>
        </div>

        {/* Text Diff Visualization */}
        {results.originalText && results.typedText && (
            <div className="w-full bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-8 shadow-inner">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex justify-between items-center">
                    <span>Text Comparison</span>
                    <span className="text-[10px] normal-case bg-slate-700 px-2 py-1 rounded text-slate-300">
                        {mode === 'PHYSICAL' ? 'Left: Original (Amber=Missed) | Right: You (Red=Error)' : 'Red: Input | Strikethrough: Expected'}
                    </span>
                </h3>
                {mode === 'PHYSICAL' ? (
                    <SplitTextDiffView original={results.originalText} typed={results.typedText} />
                ) : (
                    <TextDiffView original={results.originalText} typed={results.typedText} />
                )}
            </div>
        )}

        {/* Performance Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-8">
            
            {/* Current Session Chart */}
            {sessionChartData.length > 2 && (
                <div className="w-full h-80 bg-slate-800/50 rounded-2xl border border-slate-700 p-6 shadow-inner flex flex-col">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Session Performance</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sessionChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} domain={['dataMin - 10', 'auto']} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 2 }} />
                                <Line type="monotone" dataKey="wpm" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#818cf8' }} animationDuration={1000} />
                                <Line type="monotone" dataKey="raw" stroke="#475569" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Progress History Bar Chart */}
            <ProgressChart 
                history={history} 
                highlightId={history[history.length - 1]?.id} 
                className="h-80"
            />
        </div>

        {/* Practice Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            {/* Hard Keys Section */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 flex flex-col h-full relative group">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-slate-300 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Hard Keys
                    </h3>
                    {topHardKeys.length > 0 && (
                        <button 
                            onClick={() => onPractice('keys')}
                            className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full font-semibold transition-colors border border-rose-500/20"
                        >
                            Practice Keys
                        </button>
                    )}
                </div>
                
                {topHardKeys.length > 0 ? (
                    <div className="flex flex-wrap gap-3 content-start">
                        {topHardKeys.map(([key, count]) => (
                            <div key={key} className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                                <div className="bg-slate-700 min-w-[32px] h-8 flex items-center justify-center text-lg font-mono font-bold text-white rounded">
                                    {key === ' ' ? '␣' : key}
                                </div>
                                <span className="text-rose-400 font-bold text-sm">x{count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm py-4">
                        Great job! No specific problem keys detected.
                    </div>
                )}
            </div>

            {/* Missed Words Section */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 flex flex-col h-full relative">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-slate-300 font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Missed Words
                    </h3>
                    {topMissedWords.length > 0 && (
                         <button 
                            onClick={() => onPractice('words')}
                            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-semibold transition-colors border border-amber-500/20"
                        >
                            Practice Words
                        </button>
                    )}
                </div>

                {topMissedWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 content-start">
                        {topMissedWords.map(([word, count]) => (
                            <div key={word} className="group relative bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded px-3 py-1 text-sm text-slate-300 font-mono transition-colors">
                                {word}
                                <span className="ml-2 text-amber-500 text-xs font-bold">x{count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm py-4">
                        Perfection! No words were missed.
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button onClick={onReset} className="w-full sm:w-auto">
                Retry Same Test
            </Button>
             <Button onClick={onNewImage} variant="secondary" className="w-full sm:w-auto">
                Upload New Image
            </Button>
        </div>
    </div>
  );
};
