import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Clock, Menu, PlusCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type NavTab = 'dashboard' | 'record' | 'history';

interface GooeyMenuProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

interface MenuItemConfig {
  id: NavTab;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  offsetY: number;
}

/**
 * ヘッダー左上から下方向へゆったりとした間隔 (68px 刻み) で展開するアイテム座標定義
 */
const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    subLabel: 'PFC・体重・負荷グラフ',
    icon: <BarChart3 className="h-5 w-5" />,
    offsetY: 68,
  },
  {
    id: 'record',
    label: '記録を入力',
    subLabel: '食事・筋トレ・体組成を追加',
    icon: <PlusCircle className="h-5 w-5" />,
    offsetY: 136,
  },
  {
    id: 'history',
    label: '履歴一覧',
    subLabel: 'タイムライン・Cold DB同期確認',
    icon: <Clock className="h-5 w-5" />,
    offsetY: 204,
  },
];

/**
 * ヘッダー左上に配置され、背景全体のすりガラス効果 (backdrop-blur-md) と
 * 下方向への粘性（Gooey）エフェクトを伴って展開するメニュー
 */
export const GooeyMenu: React.FC<GooeyMenuProps> = ({ activeTab, onChangeTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (tab: NavTab) => {
    onChangeTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. SVG Gooey フィルター定義 (非表示) */}
      <svg
        className="pointer-events-none fixed h-0 w-0 opacity-0"
        aria-hidden="true"
      >
        <defs>
          <filter id="japandi-gooey-header-filter">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="9"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/*
        2. フルスクリーン・すりガラスオーバーレイ (document.body へ Portal 描画)
        Header の backdrop-blur 包含ブロック制限を回避し、グラフやダッシュボード画面全体を確実にぼかす
      */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="gooey-backdrop-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40 bg-theme-dark/25 backdrop-blur-md"
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* 3. ヘッダー内のインライン配置コンテナ (z-50 でぼかしオーバーレイより前面に表示) */}
      <div className="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center">
        {/*
          レイヤーA: SVG Gooey フィルター適用レイヤー (円形ブロブのみを描画して粘り気を表現)
        */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ filter: 'url(#japandi-gooey-header-filter)' }}
        >
          {MENU_ITEMS.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <motion.div
                key={`blob-${item.id}`}
                initial={false}
                animate={{
                  y: isOpen ? item.offsetY : 0,
                  scale: isOpen ? 1 : 0.5,
                }}
                transition={{
                  type: 'spring',
                  stiffness: isOpen ? 310 - idx * 25 : 360,
                  damping: isOpen ? 19 : 26,
                  mass: 0.88,
                }}
                className={`absolute rounded-full ${
                  isActive ? 'bg-theme-main' : 'bg-theme-dark'
                }`}
                style={{ width: '48px', height: '48px' }}
              />
            );
          })}

          {/* メインハンバーガーボタンのベースブロブ */}
          <motion.div
            animate={{
              scale: isOpen ? [1, 1.2, 0.94, 1.04] : [1, 1.12, 0.96, 1],
            }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
            className="rounded-full bg-theme-dark"
            style={{ width: '42px', height: '42px' }}
          />
        </div>

        {/*
          レイヤーB: インタラクティブ・アイコン＆視認性を高めたラベルカードレイヤー
        */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {MENU_ITEMS.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <motion.div
                key={`item-wrapper-${item.id}`}
                initial={false}
                animate={{
                  y: isOpen ? item.offsetY : 0,
                  scale: isOpen ? 1 : 0.4,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: isOpen ? 310 - idx * 25 : 360,
                  damping: isOpen ? 19 : 26,
                  mass: 0.88,
                }}
                style={{
                  pointerEvents: isOpen ? 'auto' : 'none',
                }}
                className="absolute left-0 flex items-center gap-4"
              >
                {/* アイコン丸ボタン (Gooey ブロブと完全に重なる 48x48 領域) */}
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  style={{ width: '48px', height: '48px' }}
                  className="group flex shrink-0 items-center justify-center rounded-full text-white focus:outline-none"
                >
                  <span className="flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </span>
                </button>

                {/*
                  ぼやけた背景からくっきりと浮かび上がるテキストラベルピル
                  十分な余白 (gap-4) とパディング (px-4 py-2.5)、ドロップシャドウ (shadow-lg) を適用
                */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      initial={{ opacity: 0, x: -12, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.94 }}
                      transition={{
                        duration: 0.2,
                        delay: 0.04 + idx * 0.035,
                        ease: 'easeOut',
                      }}
                      className={`flex flex-col items-start whitespace-nowrap rounded-2xl border px-4 py-2 text-left shadow-lg transition-all duration-200 hover:translate-x-1 ${
                        isActive
                          ? 'border-theme-main bg-theme-dark text-white ring-2 ring-theme-main/40'
                          : 'border-theme-muted/50 bg-white text-theme-dark hover:border-theme-main hover:bg-theme-bg'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tracking-wide">
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-theme-main px-2 py-0.5 text-[10px] font-semibold text-white">
                            表示中
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] ${
                          isActive ? 'text-theme-bg/90' : 'text-theme-muted'
                        }`}
                      >
                        {item.subLabel}
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* ヘッダー左上のメインハンバーガー / クローズボタン */}
          <motion.button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            whileTap={{ scale: 0.9 }}
            aria-label="メニューを開閉"
            style={{ width: '42px', height: '42px' }}
            className="pointer-events-auto relative z-20 flex items-center justify-center rounded-full text-white shadow-sm focus:outline-none"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            >
              {isOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </>
  );
};
