import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GameMode, SavedTest, TimeLimit } from '../types';

interface SavedTestsListProps {
  tests: SavedTest[];
  onPlay: (test: SavedTest, timeLimit: TimeLimit, mode: GameMode, isSSC: boolean) => void;
  onDelete: (id: string) => void;
}

export const SavedTestsList: React.FC<SavedTestsListProps> = ({ tests, onPlay, onDelete }) => {
  const [playOptions, setPlayOptions] = useState<Record<string, { timeLimit: TimeLimit; mode: GameMode; isSSC: boolean }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const timeOptions = useMemo(
    () => [
      { label: 'Finish Text', value: 0 as TimeLimit },
      { label: '1 Min', value: 60 as TimeLimit },
      { label: '2 Min', value: 120 as TimeLimit },
      { label: '5 Min', value: 300 as TimeLimit },
      { label: '10 Min', value: 600 as TimeLimit },
    ],
    []
  );

  const getOptions = (test: SavedTest) =>
    playOptions[test.id] || {
      timeLimit: 60 as TimeLimit,
      mode: test.gameMode || 'DIGITAL',
      isSSC: false,
    };

  const updateOptions = (test: SavedTest, next: Partial<{ timeLimit: TimeLimit; mode: GameMode; isSSC: boolean }>) => {
    setPlayOptions(prev => ({
      ...prev,
      [test.id]: {
        timeLimit: prev[test.id]?.timeLimit ?? 60,
        mode: prev[test.id]?.mode ?? test.gameMode ?? 'DIGITAL',
        isSSC: prev[test.id]?.isSSC ?? false,
        ...next,
      },
    }));
  };

  if (tests.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 animate-fade-in">
        <h3 className="text-stitch-muted text-sm font-bold uppercase tracking-wider mb-4 flex justify-between items-center px-2">
            <span>Saved Tests library</span>
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white">{tests.length} tests</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map(test => {
              const selected = getOptions(test);
              return (
                <div key={test.id} className="bento-card overflow-hidden group hover:border-white/30 transition-all flex flex-col text-left">
                    {/* Preview Header */}
                    <div className="h-32 bg-black/40 relative overflow-hidden">
                        {test.imageSrc ? (
                            <img src={test.imageSrc} alt="Test Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-stitch-muted border-b border-white/5">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="font-bold text-white text-sm truncate" title={test.title}>{test.title}</h4>
                            <p className="text-xs text-stitch-muted">{new Date(test.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Content Snippet */}
                    <div className="p-4 flex-1">
                        <p className="text-xs text-stitch-muted line-clamp-3 font-mono leading-relaxed mb-4">
                            {test.text}
                        </p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOptions(test, { mode: 'DIGITAL' });
                                    }}
                                    className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark min-w-0 truncate whitespace-nowrap text-xs font-semibold rounded-md px-2 py-1.5 border transition-colors ${
                                      selected.mode === 'DIGITAL'
                                        ? 'border-white bg-white text-black'
                                        : 'border-white/10 text-stitch-muted hover:text-white'
                                    }`}
                                >
                                    Digital
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOptions(test, { mode: 'PHYSICAL' });
                                    }}
                                    className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark min-w-0 truncate whitespace-nowrap text-xs font-semibold rounded-md px-2 py-1.5 border transition-colors ${
                                      selected.mode === 'PHYSICAL'
                                        ? 'border-white bg-white text-black'
                                        : 'border-white/10 text-stitch-muted hover:text-white'
                                    }`}
                                >
                                    Paper
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOptions(test, { isSSC: !selected.isSSC });
                                    }}
                                    className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark min-w-0 truncate whitespace-nowrap text-xs font-semibold rounded-md px-2 py-1.5 border transition-colors ${
                                      selected.isSSC
                                        ? 'border-red-500 bg-red-500/20 text-red-300'
                                        : 'border-white/10 text-stitch-muted hover:text-white'
                                    }`}
                                >
                                    SSC
                                </button>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-stitch-muted mb-1 block">
                                  Time {selected.isSSC ? '(Fixed 10m)' : ''}
                                </label>
                                <select
                                    value={selected.isSSC ? 600 : selected.timeLimit}
                                    onChange={(e) =>
                                      updateOptions(test, { timeLimit: Number(e.target.value) as TimeLimit })
                                    }
                                    disabled={selected.isSSC}
                                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                                >
                                    {timeOptions.map(option => (
                                      <option key={option.value} value={option.value} className="bg-stitch-dark text-white">
                                        {option.label}
                                      </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2 justify-between">
                         <div className="flex gap-2 w-full">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay(test, selected.isSSC ? 600 : selected.timeLimit, selected.mode, selected.isSSC);
                                }} 
                                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark flex-1 bg-white hover:bg-white/90 text-black text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                Play
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (deletingId === test.id) {
                                      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
                                      setDeletingId(null);
                                      onDelete(test.id);
                                    } else {
                                      setDeletingId(test.id);
                                      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
                                      deleteTimeoutRef.current = setTimeout(() => {
                                        setDeletingId(null);
                                      }, 3000);
                                    }
                                }} 
                                className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stitch-dark p-2 rounded-lg transition-colors ${deletingId === test.id ? 'text-red-400 bg-red-500/20 font-bold text-xs px-3' : 'text-stitch-muted hover:text-red-400 hover:bg-red-500/10'}`}
                                aria-label="Delete Test"
                                title="Delete Test"
                            >
                                {deletingId === test.id ? (
                                    "Sure?"
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                )}
                            </button>
                         </div>
                    </div>
                </div>
              );
            })}
        </div>
    </div>
  );
};
