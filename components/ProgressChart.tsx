import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, Line, ReferenceLine } from 'recharts';
import { StoredResult } from '../types';

interface ProgressChartProps {
  history: StoredResult[];
  className?: string;
  highlightId?: string;
}

type MetricKey = 'netWpm' | 'accuracy';

const METRIC_CONFIG: Record<MetricKey, { label: string; suffix: string; color: string }> = {
  netWpm: { label: 'WPM', suffix: '', color: '#818cf8' },
  accuracy: { label: 'Accuracy', suffix: '%', color: '#34d399' },
};

const roundTo = (value: number, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const ProgressTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
      <p className="text-slate-400 text-xs font-bold mb-1">{data.dateLabel}</p>
      <p className="text-indigo-300 text-sm font-bold">{`WPM: ${data.netWpm}`}</p>
      <p className="text-emerald-300 text-xs">{`Accuracy: ${data.accuracy}%`}</p>
      <p className="text-slate-500 text-xs">{`Trend: ${data.trendWpm} WPM / ${data.trendAcc}%`}</p>
      <p className="text-slate-500 text-[10px] uppercase mt-1">{data.mode}</p>
    </div>
  );
};

export const ProgressChart: React.FC<ProgressChartProps> = ({ history, className = '', highlightId }) => {
  const [metric, setMetric] = useState<MetricKey>('netWpm');

  const data = useMemo(
    () =>
      history.map((entry, index) => {
        const recent = history.slice(Math.max(0, index - 4), index + 1);
        const trendWpm = roundTo(recent.reduce((sum, item) => sum + item.netWpm, 0) / recent.length, 1);
        const trendAcc = roundTo(recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length, 1);
        return {
          ...entry,
          dateLabel: new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          trendWpm,
          trendAcc,
        };
      }),
    [history]
  );

  const stats = useMemo(() => {
    if (data.length === 0) {
      return { average: 0, best: 0, trendDelta: 0 };
    }
    const values = data.map(item => item[metric]);
    const average = roundTo(values.reduce((sum, value) => sum + value, 0) / values.length, 1);
    const best = roundTo(Math.max(...values), 1);
    const recentWindow = values.slice(-5);
    const prevWindow = values.slice(Math.max(0, values.length - 10), Math.max(0, values.length - 5));
    const recentAvg = recentWindow.length ? recentWindow.reduce((sum, value) => sum + value, 0) / recentWindow.length : 0;
    const prevAvg = prevWindow.length ? prevWindow.reduce((sum, value) => sum + value, 0) / prevWindow.length : recentAvg;
    return {
      average,
      best,
      trendDelta: roundTo(recentAvg - prevAvg, 1),
    };
  }, [data, metric]);

  const yDomain = useMemo(() => {
    if (metric === 'accuracy') return [0, 100] as const;
    const maxWpm = Math.max(...data.map(item => item.netWpm), 10);
    const cap = Math.ceil((maxWpm + 8) / 10) * 10;
    return [0, cap] as const;
  }, [data, metric]);

  if (history.length === 0) return null;

  return (
    <div className={`w-full h-64 bg-slate-800/50 rounded-2xl border border-slate-700 p-4 md:p-5 shadow-inner flex flex-col ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <span>Your Progress</span>
          <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">{`Last ${history.length} tests`}</span>
        </h3>

        <div className="flex items-center gap-1 bg-slate-900/70 border border-slate-700 rounded-lg p-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(metricKey => (
            <button
              key={metricKey}
              type="button"
              onClick={() => setMetric(metricKey)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                metric === metricKey ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {METRIC_CONFIG[metricKey].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
        <div className="bg-slate-900/50 rounded-lg border border-slate-700/60 px-2 py-1.5">
          <div className="text-slate-500 uppercase">Average</div>
          <div className="text-slate-100 font-semibold">
            {stats.average}
            {METRIC_CONFIG[metric].suffix}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg border border-slate-700/60 px-2 py-1.5">
          <div className="text-slate-500 uppercase">Best</div>
          <div className="text-slate-100 font-semibold">
            {stats.best}
            {METRIC_CONFIG[metric].suffix}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg border border-slate-700/60 px-2 py-1.5">
          <div className="text-slate-500 uppercase">Trend</div>
          <div className={`font-semibold ${stats.trendDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {stats.trendDelta >= 0 ? '+' : ''}
            {stats.trendDelta}
            {METRIC_CONFIG[metric].suffix}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="dateLabel" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={yDomain} stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ProgressTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <ReferenceLine y={stats.average} stroke="#64748b" strokeDasharray="4 4" />
            <Bar dataKey={metric} radius={[6, 6, 0, 0]} barSize={16} animationDuration={1000}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.id === highlightId ? METRIC_CONFIG[metric].color : '#3b82f6'}
                  fillOpacity={entry.id === highlightId ? 1 : 0.75}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey={metric === 'accuracy' ? 'trendAcc' : 'trendWpm'}
              stroke={METRIC_CONFIG[metric].color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
