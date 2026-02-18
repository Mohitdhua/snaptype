import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { StoredResult } from '../types';

interface ProgressChartProps {
  history: StoredResult[];
  className?: string;
  highlightId?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dateStr = new Date(data.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
          <p className="text-slate-400 text-xs font-bold mb-1">{dateStr}</p>
          <p className="text-indigo-400 text-sm font-bold">{`WPM: ${data.netWpm}`}</p>
          <p className="text-emerald-400 text-xs">{`Acc: ${data.accuracy}%`}</p>
          <p className="text-slate-500 text-[10px] uppercase mt-1">{data.mode}</p>
        </div>
      );
    }
    return null;
  };

export const ProgressChart: React.FC<ProgressChartProps> = ({ history, className = '', highlightId }) => {
  if (history.length === 0) return null;

  const data = history.map(entry => ({
      ...entry,
      dateStr: new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className={`w-full h-64 bg-slate-800/50 rounded-2xl border border-slate-700 p-6 shadow-inner flex flex-col ${className}`}>
         <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 flex justify-between">
            <span>Your Progress</span>
            <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Last {history.length} Tests</span>
         </h3>
         <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="dateStr" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="netWpm" radius={[4, 4, 0, 0]} animationDuration={1500}>
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.id === highlightId ? '#6366f1' : '#3b82f6'} 
                                fillOpacity={highlightId ? (entry.id === highlightId ? 1 : 0.6) : 0.8} 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
         </div>
    </div>
  );
};
