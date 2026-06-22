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
    <div className="bento-card p-3 shadow-xl z-50 bg-black/80">
      <p className="text-stitch-muted text-xs font-bold mb-1">{data.dateLabel}</p>
      <p className="text-white text-sm font-bold">{`WPM: ${data.netWpm}`}</p>
      <p className="text-emerald-400 text-xs">{`Accuracy: ${data.accuracy}%`}</p>
      <p className="text-stitch-muted text-xs">{`Trend: ${data.trendWpm} WPM / ${data.trendAcc}%`}</p>
      <p className="text-stitch-muted text-[10px] uppercase mt-1">{data.mode}</p>
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
    <div className={`w-full h-64 bento-card p-4 md:p-6 flex flex-col ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-stitch-muted text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <span>Your Progress</span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white">{`Last ${history.length} tests`}</span>
        </h3>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map(metricKey => (
            <button
              key={metricKey}
              type="button"
              onClick={() => setMetric(metricKey)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                metric === metricKey ? 'bg-white text-black' : 'text-stitch-muted hover:text-white'
              }`}
            >
              {METRIC_CONFIG[metricKey].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="bg-white/5 rounded-xl border border-white/10 px-3 py-2 flex flex-col items-center">
          <div className="text-stitch-muted uppercase tracking-wider text-[10px]">Average</div>
          <div className="text-stitch-accent font-bold mt-1">
            {stats.average}
            {METRIC_CONFIG[metric].suffix}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 px-3 py-2 flex flex-col items-center">
          <div className="text-stitch-muted uppercase tracking-wider text-[10px]">Best</div>
          <div className="text-stitch-accent font-bold mt-1">
            {stats.best}
            {METRIC_CONFIG[metric].suffix}
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 px-3 py-2 flex flex-col items-center">
          <div className="text-stitch-muted uppercase tracking-wider text-[10px]">Trend</div>
          <div className={`font-bold mt-1 ${stats.trendDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
