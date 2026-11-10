import React from 'react';
import { motion } from 'framer-motion';

export interface LiquidTabItem<T extends string | number> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface LiquidTabsProps<T extends string | number> {
  tabs: LiquidTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  layoutIdPrefix: string;
  size?: 'sm' | 'md';
}

/**
 * クリック時に液体が滑らかに膨らみ吸い付くような「Liquid Bulge」エフェクトを持つタブコンポーネント
 */
export function LiquidTabs<T extends string | number>({
  tabs,
  activeTab,
  onChange,
  layoutIdPrefix,
  size = 'md',
}: LiquidTabsProps<T>) {
  return (
    <div className="relative inline-flex w-full items-center justify-between gap-1 rounded-2xl bg-theme-bg/90 p-1.5 shadow-inner">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={String(tab.id)}
            type="button"
            onClick={() => onChange(tab.id)}
            whileTap={{ scaleX: 1.08, scaleY: 0.92 }}
            whileHover={{ scale: isActive ? 1.02 : 1.04 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors duration-200 ${
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm'
            } ${
              isActive
                ? 'text-white'
                : 'text-theme-muted hover:text-theme-dark'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-liquid-pill`}
                initial={false}
                animate={{
                  scaleX: [1.14, 0.95, 1.03, 1],
                  scaleY: [0.86, 1.08, 0.98, 1],
                }}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 380,
                    damping: 24,
                    mass: 0.9,
                  },
                  scaleX: { duration: 0.45, ease: 'easeOut' },
                  scaleY: { duration: 0.45, ease: 'easeOut' },
                }}
                className="absolute inset-0 -z-10 rounded-xl bg-theme-dark shadow-md"
                style={{
                  boxShadow: '0 4px 14px -2px rgba(44, 79, 84, 0.45)',
                }}
              />
            )}
            {tab.icon && (
              <motion.span
                animate={isActive ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="shrink-0"
              >
                {tab.icon}
              </motion.span>
            )}
            <span className=" whitespace-nowrap">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

