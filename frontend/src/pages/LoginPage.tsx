import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Dumbbell,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { authService } from '../services/authService';
import { AuthUser } from '../types/records';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const isMockEnabled = authService.isMockConfigured();
  const [email, setEmail] = useState(isMockEnabled ? 'demo@fit-tracker.local' : '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ステップ1: 通常ログイン (signIn)
   * nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' の場合は
   * 新しいパスワードの設定画面にUIを切り替える
   */
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authService.signIn(email, password, false);
      if (res.status === 'NEW_PASSWORD_REQUIRED') {
        setRequireNewPassword(true);
        return;
      }
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ステップ2: 初回ログイン時の新しいパスワード設定 (confirmSignIn)
   */
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上で入力してください。');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません。');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.completeNewPassword(
        email,
        password,
        newPassword
      );
      onLoginSuccess(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '新しいパスワードの設定に失敗しました。パスワードポリシー（大文字・小文字・数字・記号）をご確認ください。'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.signIn('demo@fit-tracker.local', 'demo', true);
      if (res.status === 'SIGNED_IN') {
        onLoginSuccess(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-theme-bg px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm space-y-6 rounded-3xl border border-theme-muted/40 bg-white p-7 shadow-xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-dark shadow-sm">
            <Dumbbell className="h-7 w-7 text-white" />
          </div>
          <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-theme-bg px-3 py-1 text-[11px] font-semibold text-theme-dark">
            <ShieldCheck className="h-3.5 w-3.5 text-theme-main" />
            <span>Private Personal Edition (AWS Cognito)</span>
          </div>
          <h1 className="mt-2.5 text-xl font-bold text-theme-dark">
            {requireNewPassword ? '初回パスワード変更' : 'Diet & Training Tracker'}
          </h1>
          <p className="mt-1 text-xs text-theme-muted">
            {requireNewPassword
              ? 'セキュリティ保護のため、仮パスワードから本パスワードへ変更してください'
              : '認証されたオーナー専用のトレーニング・PFC管理システム'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!requireNewPassword ? (
            /* 画面1: 通常ログインフォーム */
            <motion.form
              key="signin-form"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              onSubmit={handleSignInSubmit}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-dark">
                  メールアドレス (ID)
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-theme-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-theme-muted/50 bg-white py-2.5 pl-9 pr-3 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-dark">
                  パスワード（初回は仮パスワード）
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-theme-muted" />
                  <input
                    type="password"
                    required={!isMockEnabled}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-theme-muted/50 bg-white py-2.5 pl-9 pr-3 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-theme-dark py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-theme-main disabled:opacity-50"
              >
                {loading ? 'Cognito 認証中...' : 'ログイン'}
              </motion.button>
            </motion.form>
          ) : (
            /* 画面2: 新しいパスワードの設定画面 (CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED) */
            <motion.form
              key="new-password-form"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22 }}
              onSubmit={handleNewPasswordSubmit}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 rounded-xl border border-theme-main/40 bg-theme-bg/70 px-3 py-2.5 text-xs text-theme-dark">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-theme-main" />
                <div>
                  <p className="font-semibold">{email}</p>
                  <p className="text-[11px] text-theme-muted">
                    仮パスワードが確認されました。新しいパスワードを設定してください。
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-dark">
                  新しいパスワード
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-theme-main" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8文字以上 (大文字・小文字・数字・記号)"
                    className="w-full rounded-xl border border-theme-main bg-white py-2.5 pl-9 pr-3 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-dark">
                  新しいパスワード（確認用）
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-theme-main" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="もう一度入力してください"
                    className="w-full rounded-xl border border-theme-main bg-white py-2.5 pl-9 pr-3 text-sm text-theme-dark placeholder-theme-muted focus:border-theme-dark focus:outline-none focus:ring-1 focus:ring-theme-dark"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-theme-dark py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-theme-main disabled:opacity-50"
              >
                {loading
                  ? 'パスワードを更新中...'
                  : '新しいパスワードを設定してログイン'}
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setRequireNewPassword(false);
                  setError(null);
                }}
                className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-theme-muted transition hover:text-theme-dark"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>ログイン画面に戻る</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ローカル開発・デモ許可時のみ表示 */}
        {isMockEnabled && !requireNewPassword && (
          <>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme-muted/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 font-medium text-theme-muted">
                  開発用オプション
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-theme-main/50 bg-theme-bg/60 py-2.5 text-xs font-semibold text-theme-dark transition hover:bg-theme-main hover:text-white hover:border-theme-main"
            >
              <Sparkles className="h-4 w-4 text-theme-main" />
              <span>デモモードで体験（30日分のサンプルデータ付）</span>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
