import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DietRecord, PeriodDays } from '../../types/records';

interface PfcChartProps {
  dietRecords: DietRecord[];
  periodDays: PeriodDays;
}

export const PfcChart: React.FC<PfcChartProps> = ({ dietRecords, periodDays }) => {
  const dailyData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const cutoffPrefix = cutoff.toISOString().slice(0, 10);

    const grouped = new Map<
      string,
      { date: string; calories: number; P_kcal: number; F_kcal: number; C_kcal: number }
    >();

    dietRecords.forEach((rec) => {
      const dayKey = rec.recordedAt.slice(0, 10);
      if (dayKey < cutoffPrefix) return;

      const shortDate = dayKey.slice(5).replace('-', '/');
      const current = grouped.get(dayKey) || {
        date: shortDate,
        calories: 0,
        P_kcal: 0,
        F_kcal: 0,
        C_kcal: 0,
      };
      current.calories += rec.calories;
      current.P_kcal += Math.round(rec.protein * 4);
      current.F_kcal += Math.round(rec.fat * 9);
      current.C_kcal += Math.round(rec.carbs * 4);
      grouped.set(dayKey, current);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-periodDays)
      .map(([, val]) => val);
  }, [dietRecords, periodDays]);

  return (
    <div className="rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-theme-dark">
            日別 PFC カロリー内訳推移（直近{periodDays}日間）
          </h3>
          <p className="text-xs text-theme-muted">
            タンパク質(4kcal/g)・脂質(9kcal/g)・炭水化物(4kcal/g) の積み上げ推移
          </p>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={`pfc-${periodDays}`}
            data={dailyData}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
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
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#2C4F54' }} />
            <Bar
              dataKey="P_kcal"
              name="P (タンパク質 kcal)"
              stackId="pfc"
              fill="#2C4F54"
              isAnimationActive
              animationDuration={850}
            />
            <Bar
              dataKey="F_kcal"
              name="F (脂質 kcal)"
              stackId="pfc"
              fill="#5C8A8F"
              isAnimationActive
              animationDuration={950}
            />
            <Bar
              dataKey="C_kcal"
              name="C (炭水化物 kcal)"
              stackId="pfc"
              fill="#9FAFB0"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={1050}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
