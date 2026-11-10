import React, { useEffect, useState } from 'react';
import { animate, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * 数値が 0 (または前回値) から目標値へ滑らかにカウントアップするコンポーネント
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  duration = 0.9,
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString();

  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );
};

interface AnimatedProgressBarProps {
  current: number;
  target: number;
  label?: string;
  unit?: string;
  colorClass?: string;
  steps?: number;
}

/**
 * 目標値に対する進捗をアニメーション付きプログレスバー＆ステップ区切りで表示するコンポーネント
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  current,
  target,
  label,
  unit = '',
  colorClass = 'bg-theme-dark',
  steps = 5,
}) => {
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-theme-dark">{label}</span>
          <span className="text-theme-muted">
            <strong className="text-theme-dark">
              <AnimatedCounter value={current} decimals={current % 1 !== 0 ? 1 : 0} />
            </strong>{' '}
            / {target}
            {unit} ({percentage}%)
          </span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-theme-bg">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${colorClass}`}
        />
        {/* ステップ目盛りオーバーレイ */}
        {steps > 1 && (
          <div className="pointer-events-none absolute inset-0 flex justify-between px-1">
            {Array.from({ length: steps - 1 }).map((_, idx) => (
              <div
                key={idx}
                className="h-full w-[1.5px] bg-white/60"
                style={{ marginLeft: `${100 / steps}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

