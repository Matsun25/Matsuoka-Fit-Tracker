import React, { useMemo, useState } from 'react';
import { Database, Dumbbell, Scale, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { FitnessRecord, PeriodDays, RecordType } from '../../types/records';
import { LiquidTabs } from '../common/LiquidTabs';

interface RecordListProps {
  records: FitnessRecord[];
  periodDays: PeriodDays;
}

export const RecordList: React.FC<RecordListProps> = ({ records, periodDays }) => {
  const [filterType, setFilterType] = useState<'ALL' | RecordType>('ALL');

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodDays);
    const cutoffPrefix = cutoff.toISOString().slice(0, 10);

    return records.filter((r) => {
      const inPeriod = r.recordedAt.slice(0, 10) >= cutoffPrefix;
      const matchesType = filterType === 'ALL' || r.recordType === filterType;
      return inPeriod && matchesType;
    });
  }, [records, periodDays, filterType]);

  const formatDateTime = (iso: string) => {
    try {
      const dt = new Date(iso);
      return dt.toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-3">
      <LiquidTabs<'ALL' | RecordType>
        layoutIdPrefix="history-filter"
        size="sm"
        activeTab={filterType}
        onChange={setFilterType}
        tabs={[
          { id: 'ALL', label: 'すべて' },
          { id: 'DIET', label: '食事 (PFC)' },
          { id: 'WORKOUT', label: 'トレーニング' },
          { id: 'BODY', label: '体組成' },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-theme-muted/40 bg-white p-8 text-center text-sm text-theme-muted">
          該当期間の記録がありません。
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((rec, idx) => {
            if (rec.recordType === 'DIET') {
              return (
                <motion.div
                  key={rec.recordKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.25) }}
                  className="rounded-2xl border border-theme-muted/40 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-bg text-theme-dark">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-theme-dark">
                            {rec.menuName}
                          </p>
                          <span className="text-[11px] text-theme-muted">
                            {formatDateTime(rec.recordedAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-theme-muted">
                          P:{' '}
                          <span className="font-semibold text-theme-dark">
                            {rec.protein}g
                          </span>{' '}
                          / F:{' '}
                          <span className="font-semibold text-theme-dark">
                            {rec.fat}g
                          </span>{' '}
                          / C:{' '}
                          <span className="font-semibold text-theme-dark">
                            {rec.carbs}g
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-theme-dark">
                        {rec.calories} kcal
                      </span>
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-theme-muted">
                        <Database className="h-3 w-3" />
                        <span>{rec.syncedToCold ? 'Cold DB済' : 'Hot DB'}</span>
                      </div>
                    </div>
                  </div>

                  {rec.ingredients && rec.ingredients.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-theme-muted/25 pt-2">
                      {rec.ingredients.map((ing, i) => (
                        <span
                          key={`${rec.recordKey}-ing-${i}`}
                          className="rounded-md bg-theme-bg/80 px-2 py-0.5 text-[11px] text-theme-dark"
                        >
                          {ing.name} ({ing.calories}kcal: P{ing.protein}/F{ing.fat}/C
                          {ing.carbs})
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            }

            if (rec.recordType === 'WORKOUT') {
              const vol = Math.round(rec.weight * rec.reps * rec.sets);
              return (
                <motion.div
                  key={rec.recordKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.25) }}
                  className="flex items-center justify-between rounded-2xl border border-theme-muted/40 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-bg text-theme-dark">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-theme-dark">
                          {rec.workoutName}
                        </p>
                        <span className="text-[11px] text-theme-muted">
                          {formatDateTime(rec.recordedAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-theme-dark">
                        {rec.weight} kg × {rec.reps} 回 × {rec.sets} セット
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-theme-dark">
                      {vol.toLocaleString()} kg
                    </span>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-theme-muted">
                      <Database className="h-3 w-3" />
                      <span>{rec.syncedToCold ? 'Cold DB済' : 'Hot DB'}</span>
                    </div>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={rec.recordKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.25) }}
                className="flex items-center justify-between rounded-2xl border border-theme-muted/40 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-theme-bg text-theme-dark">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-theme-dark">
                        体重 {rec.bodyWeight} kg
                      </p>
                      <span className="text-[11px] text-theme-muted">
                        {formatDateTime(rec.recordedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-theme-muted">
                      体脂肪率:{' '}
                      {rec.bodyFatPercentage !== undefined
                        ? `${rec.bodyFatPercentage}%`
                        : '未入力'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-[10px] text-theme-muted">
                    <Database className="h-3 w-3" />
                    <span>{rec.syncedToCold ? 'Cold DB済' : 'Hot DB'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
