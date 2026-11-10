import React, { useMemo } from 'react';
import { Flame, Dumbbell, Scale, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { BodyRecord, DietRecord, PeriodDays, WorkoutRecord } from '../../types/records';
import { AnimatedCounter, AnimatedProgressBar } from '../common/AnimatedProgress';

interface SummaryCardsProps {
  dietRecords: DietRecord[];
  workoutRecords: WorkoutRecord[];
  bodyRecords: BodyRecord[];
  periodDays: PeriodDays;
}

const TARGET_CALORIES = 2200;
const TARGET_PROTEIN = 140;
const TARGET_FAT = 60;
const TARGET_CARBS = 250;

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  dietRecords,
  workoutRecords,
  bodyRecords,
  periodDays,
}) => {
  const todayStats = useMemo(() => {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const targetDatePrefix =
      dietRecords.find((d) => d.recordedAt.startsWith(todayPrefix))?.recordedAt.slice(0, 10) ||
      dietRecords[0]?.recordedAt.slice(0, 10) ||
      todayPrefix;

    const dayDiets = dietRecords.filter((d) =>
      d.recordedAt.startsWith(targetDatePrefix)
    );

    const calories = dayDiets.reduce((sum, d) => sum + d.calories, 0);
    const protein = dayDiets.reduce((sum, d) => sum + d.protein, 0);
    const fat = dayDiets.reduce((sum, d) => sum + d.fat, 0);
    const carbs = dayDiets.reduce((sum, d) => sum + d.carbs, 0);

    return {
      dateLabel: targetDatePrefix === todayPrefix ? '今日' : targetDatePrefix.slice(5),
      calories,
      protein: Math.round(protein * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
    };
  }, [dietRecords]);

  const periodBodyStats = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const iso = cutoff.toISOString();
    const inPeriod = bodyRecords.filter((b) => b.recordedAt >= iso);
    const latest = bodyRecords[0];
    const oldestInPeriod = inPeriod[inPeriod.length - 1] || bodyRecords[1];
    const diff =
      latest && oldestInPeriod
        ? Number((latest.bodyWeight - oldestInPeriod.bodyWeight).toFixed(1))
        : null;
    return { latest, diff };
  }, [bodyRecords, periodDays]);

  const periodWorkoutStats = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const iso = cutoff.toISOString();
    const inPeriod = workoutRecords.filter((w) => w.recordedAt >= iso);
    const totalVolume = inPeriod.reduce(
      (sum, w) => sum + Math.round(w.weight * w.reps * w.sets),
      0
    );
    const targetSessions = periodDays === 7 ? 4 : 16;
    return {
      count: inPeriod.length,
      totalVolume,
      targetSessions,
    };
  }, [workoutRecords, periodDays]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* 1. カロリー & PFC Progress Steps カード */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-theme-muted">
            摂取カロリー ({todayStats.dateLabel})
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-bg text-theme-dark">
            <Flame className="h-4 w-4 text-theme-dark" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <AnimatedCounter
            value={todayStats.calories}
            className="text-2xl font-bold text-theme-dark"
          />
          <span className="text-xs text-theme-muted">/ {TARGET_CALORIES} kcal</span>
        </div>

        <div className="mt-2">
          <AnimatedProgressBar
            current={todayStats.calories}
            target={TARGET_CALORIES}
            colorClass="bg-theme-dark"
            steps={5}
          />
        </div>

        <div className="mt-3 space-y-1.5 border-t border-theme-muted/30 pt-2.5">
          <AnimatedProgressBar
            label="P (タンパク質)"
            current={todayStats.protein}
            target={TARGET_PROTEIN}
            unit="g"
            colorClass="bg-theme-dark"
            steps={4}
          />
          <AnimatedProgressBar
            label="F (脂質)"
            current={todayStats.fat}
            target={TARGET_FAT}
            unit="g"
            colorClass="bg-theme-main"
            steps={4}
          />
          <AnimatedProgressBar
            label="C (炭水化物)"
            current={todayStats.carbs}
            target={TARGET_CARBS}
            unit="g"
            colorClass="bg-theme-muted"
            steps={4}
          />
        </div>
      </motion.div>

      {/* 2. 最新体重 & 体脂肪率カード */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted">
              体組成 ({periodDays}日間変動)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-bg text-theme-dark">
              <Scale className="h-4 w-4 text-theme-dark" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {periodBodyStats.latest ? (
              <AnimatedCounter
                value={periodBodyStats.latest.bodyWeight}
                decimals={1}
                className="text-2xl font-bold text-theme-dark"
              />
            ) : (
              <span className="text-2xl font-bold text-theme-dark">--</span>
            )}
            <span className="text-xs text-theme-muted">kg</span>
            {periodBodyStats.diff !== null && (
              <span
                className={`ml-auto inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  periodBodyStats.diff <= 0
                    ? 'bg-theme-bg text-theme-dark border border-theme-muted/50'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <TrendingDown className="h-3 w-3" />
                {periodBodyStats.diff > 0
                  ? `+${periodBodyStats.diff}`
                  : periodBodyStats.diff}{' '}
                kg
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2 border-t border-theme-muted/30 pt-2.5">
          <AnimatedProgressBar
            label="体脂肪率 (目標 12.0%)"
            current={periodBodyStats.latest?.bodyFatPercentage ?? 0}
            target={25}
            unit="%"
            colorClass="bg-theme-main"
            steps={5}
          />
          <p className="text-[11px] text-theme-muted">
            最新測定:{' '}
            <strong className="text-theme-dark font-semibold">
              {periodBodyStats.latest?.recordedAt.slice(0, 10) || '未計測'}
            </strong>
          </p>
        </div>
      </motion.div>

      {/* 3. 期間内のワークアウト実績 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
        className="rounded-2xl border border-theme-muted/40 bg-white p-4 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-theme-muted">
              直近{periodDays}日間のトレーニング
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-bg text-theme-dark">
              <Dumbbell className="h-4 w-4 text-theme-dark" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <AnimatedCounter
              value={periodWorkoutStats.count}
              className="text-2xl font-bold text-theme-dark"
            />
            <span className="text-xs text-theme-muted">セッション達成</span>
            <span className="ml-auto text-xs font-semibold text-theme-main">
              総負荷:{' '}
              <AnimatedCounter value={periodWorkoutStats.totalVolume} suffix=" kg" />
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2 border-t border-theme-muted/30 pt-2.5">
          <AnimatedProgressBar
            label={`${periodDays}日間セッション目標`}
            current={periodWorkoutStats.count}
            target={periodWorkoutStats.targetSessions}
            unit="回"
            colorClass="bg-theme-dark"
            steps={4}
          />
          <p className="truncate text-[11px] text-theme-muted">
            直近:{' '}
            <strong className="text-theme-dark font-semibold">
              {workoutRecords[0]
                ? `${workoutRecords[0].workoutName} (${workoutRecords[0].weight}kg × ${workoutRecords[0].reps})`
                : '記録なし'}
            </strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
