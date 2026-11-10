import React, { useState } from 'react';
import { Calendar, Dumbbell, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateWorkoutInput, WorkoutRecord } from '../../types/records';
import { AnimatedCounter } from '../common/AnimatedProgress';

interface WorkoutFormProps {
  onSubmit: (input: CreateWorkoutInput) => Promise<unknown>;
  recentWorkouts: WorkoutRecord[];
}

const POPULAR_EXERCISES = [
  'ベンチプレス',
  'スクワット',
  'デッドリフト',
  'ラットプルダウン',
  'ショルダープレス',
  'ダンベルカール',
];

function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  onSubmit,
  recentWorkouts,
}) => {
  const [workoutDate, setWorkoutDate] = useState<string>(() => getTodayDateString());
  const [workoutName, setWorkoutName] = useState('ベンチプレス');
  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('10');
  const [sets, setSets] = useState('3');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectExercise = (name: string) => {
    setWorkoutName(name);
    const lastSame = recentWorkouts.find((w) => w.workoutName === name);
    if (lastSame) {
      setWeight(String(lastSame.weight));
      setReps(String(lastSame.reps));
      setSets(String(lastSame.sets));
    }
  };

  const setRelativeDate = (daysAgo: number) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - daysAgo);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    setWorkoutDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const s = parseInt(sets, 10);

    if (!workoutName.trim()) {
      setErrorMsg('種目名を入力してください。');
      return;
    }
    if (isNaN(w) || w < 0 || isNaN(r) || r <= 0 || isNaN(s) || s <= 0) {
      setErrorMsg('重量・回数・セット数を正しく入力してください。');
      return;
    }

    // 選択された日付 + 現在時刻の秒数を組み合わせて一意な ISO8601 UTC 文字列を生成
    const now = new Date();
    const [year, month, day] = workoutDate.split('-').map(Number);
    const recordedDateObj = new Date(
      year || now.getFullYear(),
      (month || now.getMonth() + 1) - 1,
      day || now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    const recordedAtIso = recordedDateObj.toISOString().replace(/\.\d{3}Z$/, 'Z');

    setSubmitting(true);
    try {
      await onSubmit({
        workoutName: workoutName.trim(),
        weight: w,
        reps: r,
        sets: s,
        recordedAt: recordedAtIso,
      });
      setSuccessMsg(
        `[${workoutDate}] ${workoutName} (${w}kg × ${r}回 × ${s}セット) を記録しました！`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const totalVolume =
    (parseFloat(weight) || 0) * (parseInt(reps, 10) || 0) * (parseInt(sets, 10) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 記録日ピッカー (過去日への入力忘れ対応) */}
      <div className="rounded-xl border border-theme-muted/40 bg-theme-bg/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-dark">
            <Calendar className="h-4 w-4 text-theme-main" />
            <span>トレーニング記録日（過去日の入力可）</span>
          </label>
          <div className="flex items-center gap-1">
            {[
              { label: '今日', daysAgo: 0 },
              { label: '昨日', daysAgo: 1 },
              { label: '一昨日', daysAgo: 2 },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => setRelativeDate(btn.daysAgo)}
                className="rounded-md border border-theme-muted/50 bg-white px-2 py-0.5 text-[11px] font-medium text-theme-dark transition hover:bg-theme-main hover:text-white"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <input
            type="date"
            value={workoutDate}
            max={getTodayDateString()}
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="w-full rounded-xl border border-theme-muted/50 bg-white px-3 py-2 text-sm font-medium text-theme-dark focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
          />
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-theme-muted">
          種目クイック選択（前回の重量を自動復元）
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_EXERCISES.map((name) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={name}
              type="button"
              onClick={() => handleSelectExercise(name)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                workoutName === name
                  ? 'border-theme-dark bg-theme-dark text-white shadow-sm'
                  : 'border-theme-muted/50 bg-theme-bg/60 text-theme-dark hover:bg-theme-main hover:text-white hover:border-theme-main'
              }`}
            >
              {name}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-theme-dark">
          種目名 <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Dumbbell className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-theme-muted" />
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="例: ベンチプレス"
            className="w-full rounded-xl border border-theme-muted/50 bg-white py-2.5 pl-9 pr-3 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-theme-dark">
            重量 (kg)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-xl border border-theme-muted/50 bg-white px-3 py-2.5 text-sm text-theme-dark focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-theme-dark">
            回数 (reps)
          </label>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full rounded-xl border border-theme-muted/50 bg-white px-3 py-2.5 text-sm text-theme-dark focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-theme-dark">
            セット数 (sets)
          </label>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="w-full rounded-xl border border-theme-muted/50 bg-white px-3 py-2.5 text-sm text-theme-dark focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-theme-muted/40 bg-theme-bg/60 px-3.5 py-2.5 text-xs text-theme-dark">
        <span>総負荷量 (Volume = 重量 × 回数 × セット):</span>
        <AnimatedCounter
          value={totalVolume}
          suffix=" kg"
          className="text-sm font-bold text-theme-dark"
        />
      </div>

      {errorMsg && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-theme-main/30 bg-theme-bg px-3 py-2 text-xs text-theme-dark">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-theme-dark" />
          <span>{successMsg}</span>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-theme-dark py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-theme-main disabled:opacity-50"
      >
        {submitting ? '保存中...' : `${workoutDate} のトレーニング記録を保存する`}
      </motion.button>
    </form>
  );
};
