import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BodyRecord, PeriodDays } from '../../types/records';

interface BodyChartProps {
  bodyRecords: BodyRecord[];
  periodDays: PeriodDays;
}

export const BodyChart: React.FC<BodyChartProps> = ({ bodyRecords, periodDays }) => {
  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const cutoffPrefix = cutoff.toISOString().slice(0, 10);

    return [...bodyRecords]
      .filter((r) => r.recordedAt.slice(0, 10) >= cutoffPrefix)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
      .slice(-periodDays)
      .map((r) => ({
        date: r.recordedAt.slice(5, 10).replace('-', '/'),
        weight: r.bodyWeight,
        bodyFat: r.bodyFatPercentage ?? null,
      }));
  }, [bodyRecords, periodDays]);

  return (
    <div className="rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-theme-dark">
          体重・体脂肪率推移（直近{periodDays}日間）
        </h3>
        <p className="text-xs text-theme-muted">左軸: 体重 (kg) / 右軸: 体脂肪率 (%)</p>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            key={`body-${periodDays}`}
            data={chartData}
            margin={{ top: 8, right: 0, left: -18, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE6" />
            <XAxis dataKey="date" stroke="#9FAFB0" fontSize={10} />
            <YAxis
              yAxisId="left"
              stroke="#2C4F54"
              fontSize={11}
              domain={['dataMin - 0.8', 'dataMax + 0.8']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#5C8A8F"
              fontSize={11}
              domain={['dataMin - 0.8', 'dataMax + 0.8']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#9FAFB0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#2C4F54',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#2C4F54' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              name="体重 (kg)"
              stroke="#2C4F54"
              strokeWidth={2.5}
              dot={{ r: periodDays === 7 ? 3.5 : 2, fill: '#2C4F54' }}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bodyFat"
              name="体脂肪率 (%)"
              stroke="#5C8A8F"
              strokeWidth={2}
              dot={{ r: periodDays === 7 ? 3 : 2, fill: '#5C8A8F' }}
              connectNulls
              isAnimationActive
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
