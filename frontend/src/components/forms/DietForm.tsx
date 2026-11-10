import React, { useMemo, useState } from 'react';
import { Flame, Utensils, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreateDietInput, DietIngredient } from '../../types/records';
import { AnimatedCounter, AnimatedProgressBar } from '../common/AnimatedProgress';

interface DietFormProps {
  onSubmit: (input: CreateDietInput) => Promise<unknown>;
}

interface IngredientRow {
  id: string;
  name: string;
  protein: string;
  fat: string;
  carbs: string;
}

const MAX_INGREDIENTS = 10;

const INGREDIENT_PRESETS = [
  { label: '鶏胸肉 150g', name: '鶏胸肉(皮なし) 150g', p: 33.0, f: 2.8, c: 0.0 },
  { label: '白米 150g', name: '白米 150g', p: 3.8, f: 0.5, c: 55.7 },
  { label: '玄米 150g', name: '玄米 150g', p: 4.2, f: 1.5, c: 53.4 },
  { label: '全卵 1個', name: '全卵 1個', p: 6.2, f: 5.2, c: 0.2 },
  { label: 'プロテイン 1杯', name: 'ホエイプロテイン', p: 24.0, f: 1.5, c: 3.0 },
  { label: 'ブロッコリー 100g', name: 'ブロッコリー 100g', p: 4.3, f: 0.5, c: 5.2 },
  { label: '納豆 1パック', name: '納豆 1パック', p: 8.3, f: 5.0, c: 6.1 },
  { label: 'バナナ 1本', name: 'バナナ 1本', p: 1.1, f: 0.2, c: 22.5 },
];

function createEmptyRow(defaultName = ''): IngredientRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: defaultName,
    protein: '',
    fat: '',
    carbs: '',
  };
}

export const DietForm: React.FC<DietFormProps> = ({ onSubmit }) => {
  const [mealLabel, setMealLabel] = useState('昼食');
  const [rows, setRows] = useState<IngredientRow[]>(() => [
    {
      id: 'initial-1',
      name: '鶏胸肉(皮なし) 150g',
      protein: '33.0',
      fat: '2.8',
      carbs: '0.0',
    },
    {
      id: 'initial-2',
      name: '玄米 150g',
      protein: '4.2',
      fat: '1.5',
      carbs: '53.4',
    },
  ]);
  const [customCalories, setCustomCalories] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totals = useMemo(() => {
    let totalP = 0;
    let totalF = 0;
    let totalC = 0;

    rows.forEach((r) => {
      totalP += parseFloat(r.protein) || 0;
      totalF += parseFloat(r.fat) || 0;
      totalC += parseFloat(r.carbs) || 0;
    });

    const p = Math.round(totalP * 10) / 10;
    const f = Math.round(totalF * 10) / 10;
    const c = Math.round(totalC * 10) / 10;
    const calories = Math.round(p * 4 + f * 9 + c * 4);

    return { p, f, c, calories };
  }, [rows]);

  const handleUpdateRow = (
    id: string,
    field: keyof Omit<IngredientRow, 'id'>,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    if (rows.length >= MAX_INGREDIENTS) return;
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddPresetIngredient = (preset: (typeof INGREDIENT_PRESETS)[number]) => {
    setErrorMsg(null);
    // もし1行目が完全に空ならそこを埋める、それ以外は新規行として追加（最大10行）
    const emptyIdx = rows.findIndex(
      (r) => !r.name.trim() && !r.protein && !r.fat && !r.carbs
    );
    if (emptyIdx !== -1) {
      setRows((prev) =>
        prev.map((r, idx) =>
          idx === emptyIdx
            ? {
                ...r,
                name: preset.name,
                protein: String(preset.p),
                fat: String(preset.f),
                carbs: String(preset.c),
              }
            : r
        )
      );
      return;
    }

    if (rows.length >= MAX_INGREDIENTS) {
      setErrorMsg(`食材は最大 ${MAX_INGREDIENTS} 品まで追加できます。`);
      return;
    }

    setRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: preset.name,
        protein: String(preset.p),
        fat: String(preset.f),
        carbs: String(preset.c),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const validIngredients: DietIngredient[] = rows
      .filter((r) => r.name.trim().length > 0)
      .map((r) => {
        const p = parseFloat(r.protein) || 0;
        const f = parseFloat(r.fat) || 0;
        const c = parseFloat(r.carbs) || 0;
        return {
          name: r.name.trim(),
          protein: p,
          fat: f,
          carbs: c,
          calories: Math.round(p * 4 + f * 9 + c * 4),
        };
      });

    if (validIngredients.length === 0) {
      setErrorMsg('少なくとも1品の食材名を入力してください。');
      return;
    }

    const joinedNames = validIngredients.map((i) => i.name).join(' + ');
    const summaryMenuName = mealLabel.trim()
      ? `${mealLabel.trim()}: ${joinedNames}`
      : joinedNames;

    const finalCalories = customCalories
      ? parseInt(customCalories, 10)
      : totals.calories;

    setSubmitting(true);
    try {
      await onSubmit({
        menuName: summaryMenuName.slice(0, 250),
        protein: totals.p,
        fat: totals.f,
        carbs: totals.c,
        calories: finalCalories,
        ingredients: validIngredients,
      });
      setRows([createEmptyRow()]);
      setCustomCalories('');
      setSuccessMsg(
        `「${summaryMenuName}」(${finalCalories} kcal / ${validIngredients.length}品) を記録しました！`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 食事区分 & クイック食材追加 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {(['朝食', '昼食', '夕食', '間食'] as const).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setMealLabel(label)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                mealLabel === label
                  ? 'bg-theme-dark text-white shadow-sm'
                  : 'bg-theme-bg text-theme-muted hover:text-theme-dark'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-theme-muted">
          登録食材: <strong className="text-theme-dark">{rows.length}</strong> / {MAX_INGREDIENTS} 品
        </span>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-theme-muted">
          食材ワンタップ追加（タップで行に追加）
        </span>
        <div className="flex flex-wrap gap-1.5">
          {INGREDIENT_PRESETS.map((preset) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={preset.label}
              type="button"
              onClick={() => handleAddPresetIngredient(preset)}
              className="rounded-lg border border-theme-muted/50 bg-theme-bg/60 px-2.5 py-1 text-xs font-medium text-theme-dark transition hover:bg-theme-main hover:text-white hover:border-theme-main"
            >
              + {preset.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 動的食材リスト (最大10品) */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-12 gap-1.5 px-1 text-[11px] font-semibold text-theme-muted">
          <div className="col-span-5">食材名 (最大10品)</div>
          <div className="col-span-2 text-center">P (g)</div>
          <div className="col-span-2 text-center">F (g)</div>
          <div className="col-span-2 text-center">C (g)</div>
          <div className="col-span-1 text-center">削除</div>
        </div>

        <AnimatePresence initial={false}>
          {rows.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-12 items-center gap-1.5 rounded-xl border border-theme-muted/40 bg-theme-bg/35 p-2"
            >
              <div className="col-span-5 relative">
                <Utensils className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-theme-muted" />
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                  placeholder={`食材 #${index + 1}`}
                  className="w-full rounded-lg border border-theme-muted/50 bg-white py-1.5 pl-7 pr-2 text-xs text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={row.protein}
                  onChange={(e) => handleUpdateRow(row.id, 'protein', e.target.value)}
                  placeholder="P"
                  className="w-full rounded-lg border border-theme-muted/50 bg-white px-1.5 py-1.5 text-center text-xs text-theme-dark focus:border-theme-dark focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={row.fat}
                  onChange={(e) => handleUpdateRow(row.id, 'fat', e.target.value)}
                  placeholder="F"
                  className="w-full rounded-lg border border-theme-muted/50 bg-white px-1.5 py-1.5 text-center text-xs text-theme-dark focus:border-theme-dark focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={row.carbs}
                  onChange={(e) => handleUpdateRow(row.id, 'carbs', e.target.value)}
                  placeholder="C"
                  className="w-full rounded-lg border border-theme-muted/50 bg-white px-1.5 py-1.5 text-center text-xs text-theme-dark focus:border-theme-dark focus:outline-none"
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={rows.length <= 1}
                  title="この食材を削除"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-theme-muted transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {rows.length < MAX_INGREDIENTS && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleAddRow}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-theme-main/60 bg-white py-2 text-xs font-semibold text-theme-dark transition hover:bg-theme-bg"
          >
            <Plus className="h-4 w-4 text-theme-main" />
            <span>食材行を追加する (Add row: 残り {MAX_INGREDIENTS - rows.length} 品)</span>
          </motion.button>
        )}
      </div>

      {/* 1食分の合計 PFC & カロリー自動計算サマリー (Progress Steps 付き) */}
      <div className="space-y-2.5 rounded-2xl border border-theme-muted/40 bg-theme-bg/60 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-theme-dark">
            <Flame className="h-4 w-4 text-theme-main" />
            <span className="font-semibold">1食合計カロリー:</span>
            <AnimatedCounter
              value={totals.calories}
              suffix=" kcal"
              className="text-base font-bold text-theme-dark"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-theme-muted">手動調整:</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              placeholder={`${totals.calories}`}
              className="w-20 rounded-lg border border-theme-muted/50 bg-white px-2 py-1 text-right text-xs text-theme-dark focus:border-theme-dark focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <AnimatedProgressBar
            label="合計 P"
            current={totals.p}
            target={50}
            unit="g"
            colorClass="bg-theme-dark"
            steps={4}
          />
          <AnimatedProgressBar
            label="合計 F"
            current={totals.f}
            target={25}
            unit="g"
            colorClass="bg-theme-main"
            steps={4}
          />
          <AnimatedProgressBar
            label="合計 C"
            current={totals.c}
            target={80}
            unit="g"
            colorClass="bg-theme-muted"
            steps={4}
          />
        </div>
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
        {submitting ? '保存中...' : '1食分の食事記録を保存する'}
      </motion.button>
    </form>
  );
};
