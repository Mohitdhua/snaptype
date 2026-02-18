import React, { useMemo, useState } from 'react';
import { GameMode, SavedTest, TimeLimit } from '../types';

interface SavedTestsListProps {
  tests: SavedTest[];
  onPlay: (test: SavedTest, timeLimit: TimeLimit, mode: GameMode) => void;
  onDelete: (id: string) => void;
}

export const SavedTestsList: React.FC<SavedTestsListProps> = ({ tests, onPlay, onDelete }) => {
  const [playOptions, setPlayOptions] = useState<Record<string, { timeLimit: TimeLimit; mode: GameMode }>>({});

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
    };

  const updateOptions = (test: SavedTest, next: Partial<{ timeLimit: TimeLimit; mode: GameMode }>) => {
    setPlayOptions(prev => ({
      ...prev,
      [test.id]: {
        timeLimit: prev[test.id]?.timeLimit ?? 60,
        mode: prev[test.id]?.mode ?? test.gameMode ?? 'DIGITAL',
        ...next,
      },
    }));
  };

  if (tests.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 animate-fade-in">
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex justify-between items-center px-2">
            <span>Saved Tests library</span>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-500">{tests.length} tests</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map(test => {
              const selected = getOptions(test);
              return (
                <div key={test.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-500/10 flex flex-col text-left">
                    {/* Preview Header */}
                    <div className="h-32 bg-slate-900 relative overflow-hidden">
                        {test.imageSrc ? (
                            <img src={test.imageSrc} alt="Test Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="font-bold text-white text-sm truncate" title={test.title}>{test.title}</h4>
                            <p className="text-xs text-slate-400">{new Date(test.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Content Snippet */}
                    <div className="p-4 flex-1">
                        <p className="text-xs text-slate-400 line-clamp-3 font-mono leading-relaxed mb-4">
                            {test.text}
                        </p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOptions(test, { mode: 'DIGITAL' });
                                    }}
                                    className={`text-xs font-semibold rounded-md px-2 py-1.5 border transition-colors ${
                                      selected.mode === 'DIGITAL'
                                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
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
                                    className={`text-xs font-semibold rounded-md px-2 py-1.5 border transition-colors ${
                                      selected.mode === 'PHYSICAL'
                                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                        : 'border-slate-700 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    Paper/Physical
                                </button>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">Time</label>
                                <select
                                    value={selected.timeLimit}
                                    onChange={(e) =>
                                      updateOptions(test, { timeLimit: Number(e.target.value) as TimeLimit })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                >
                                    {timeOptions.map(option => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-slate-900/50 border-t border-slate-700 flex gap-2 justify-between">
                         <div className="flex gap-2 w-full">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay(test, selected.timeLimit, selected.mode);
                                }} 
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                Play
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(test.id);
                                }} 
                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Test"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
