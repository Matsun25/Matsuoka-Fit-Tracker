import React from 'react';
import { Dumbbell, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { AuthUser } from '../../types/records';
import { GooeyMenu, NavTab } from './GooeyMenu';

interface HeaderProps {
  user: AuthUser;
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onRefresh: () => void;
  onSignOut: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  onChangeTab,
  onRefresh,
  onSignOut,
  loading = false,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-theme-muted/40 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        {/* 左側: Gooey Menu (ハンバーガーボタン) + FitTracker ロゴ・アイコン (Flexbox 中央揃え) */}
        <div className="flex items-center gap-3">
          <GooeyMenu activeTab={activeTab} onChangeTab={onChangeTab} />

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-theme-dark shadow-sm">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold leading-tight tracking-tight text-theme-dark">
                  FitTracker
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    user.isMock
                      ? 'bg-theme-bg text-theme-dark border border-theme-muted/60'
                      : 'bg-theme-main/15 text-theme-dark border border-theme-main/40'
                  }`}
                >
                  <ShieldCheck className="h-3 w-3 text-theme-main" />
                  {user.isMock ? 'Demo Mode' : 'AWS Cognito'}
                </span>
              </div>
              <p className="text-xs text-theme-muted truncate max-w-[160px] sm:max-w-xs">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* 右側: 更新ボタン & ログアウトボタン */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="最新データを取得"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-theme-muted/50 bg-theme-bg/60 text-theme-dark transition hover:bg-theme-main hover:text-white hover:border-theme-main disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin text-theme-main' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title="ログアウト"
            className="flex items-center gap-1.5 rounded-lg border border-theme-muted/50 bg-theme-bg/60 px-3 py-2 text-xs font-medium text-theme-dark transition hover:border-theme-dark hover:bg-theme-dark hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </div>
    </header>
  );
};
