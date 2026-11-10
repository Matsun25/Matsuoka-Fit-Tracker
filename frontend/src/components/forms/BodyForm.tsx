import React, { useState } from 'react';
import { Scale, CheckCircle2 } from 'lucide-react';
import { BodyRecord, CreateBodyInput } from '../../types/records';

interface BodyFormProps {
  onSubmit: (input: CreateBodyInput) => Promise<unknown>;
  latestBody?: BodyRecord;
}

export const BodyForm: React.FC<BodyFormProps> = ({ onSubmit, latestBody }) => {
  const [bodyWeight, setBodyWeight] = useState(
    latestBody ? String(latestBody.bodyWeight) : '68.0'
  );
  const [bodyFat, setBodyFat] = useState(
    latestBody?.bodyFatPercentage ? String(latestBody.bodyFatPercentage) : '15.0'
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const w = parseFloat(bodyWeight);
    const f = bodyFat ? parseFloat(bodyFat) : undefined;

    if (isNaN(w) || w <= 10 || w > 300) {
      setErrorMsg('有効な体重 (kg) を入力してください。');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        bodyWeight: w,
        bodyFatPercentage: f,
      });
      setSuccessMsg(
        `体重 ${w}kg${f !== undefined ? ` / 体脂肪率 ${f}%` : ''} を記録しました！`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '登録に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-theme-dark">
            体重 (kg) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Scale className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-theme-muted" />
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              inputMode="decimal"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              className="w-full rounded-xl border border-theme-muted/50 bg-white py-2.5 pl-9 pr-3 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-theme-dark">
            体脂肪率 (%) <span className="text-theme-muted font-normal">(任意)</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="80"
            inputMode="decimal"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="15.0"
            className="w-full rounded-xl border border-theme-muted/50 bg-white px-3 py-2.5 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-theme-dark py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-theme-main disabled:opacity-50"
      >
        {submitting ? '保存中...' : '体組成記録を保存する'}
      </button>
    </form>
  );
};
