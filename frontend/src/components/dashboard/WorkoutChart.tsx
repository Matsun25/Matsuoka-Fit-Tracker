import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PeriodDays, WorkoutRecord } from '../../types/records';

interface WorkoutChartProps {
  workoutRecords: WorkoutRecord[];
  periodDays: PeriodDays;
}

export const WorkoutChart: React.FC<WorkoutChartProps> = ({
  workoutRecords,
  periodDays,
}) => {
  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const cutoffPrefix = cutoff.toISOString().slice(0, 10);

    return [...workoutRecords]
      .filter((w) => w.recordedAt.slice(0, 10) >= cutoffPrefix)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
      .slice(-periodDays)
      .map((w) => ({
        date: w.recordedAt.slice(5, 10).replace('-', '/'),
        workoutName: w.workoutName,
        volume: Math.round(w.weight * w.reps * w.sets),
        weight: w.weight,
      }));
  }, [workoutRecords, periodDays]);

  return (
    <div className="rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-theme-dark">
          トレーニング総負荷量 (Volume) 推移（直近{periodDays}日間）
        </h3>
        <p className="text-xs text-theme-muted">
          セッションごとの総負荷量 (重量 × 回数 × セット数 kg)
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={`workout-${periodDays}`}
            data={chartData}
            margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volumeThemeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2C4F54" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#5C8A8F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE6" />
            <XAxis dataKey="date" stroke="#9FAFB0" fontSize={10} />
            <YAxis stroke="#9FAFB0" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#9FAFB0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#2C4F54',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(
                value: number,
                _name: string,
                props: { payload?: { workoutName?: string; weight?: number } }
              ) => [
                `${value.toLocaleString()} kg (${props.payload?.workoutName || ''} ${
                  props.payload?.weight || 0
                }kg)`,
                '総負荷量',
              ]}
            />
            <Area
              type="monotone"
              dataKey="volume"
              name="総負荷量 (kg)"
              stroke="#2C4F54"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#volumeThemeGradient)"
              isAnimationActive
              animationDuration={950}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
