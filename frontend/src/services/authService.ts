import { Amplify } from 'aws-amplify';
import {
  confirmSignIn,
  fetchAuthSession,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
} from 'aws-amplify/auth';
import { AuthUser } from '../types/records';

const STORAGE_KEY = 'fit_tracker_auth_user';

const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const USE_MOCK_DEFAULT =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  !COGNITO_USER_POOL_ID ||
  !COGNITO_CLIENT_ID;

// Cognito 環境変数が設定されている場合は AWS Amplify (Headless Auth) を初期化
if (COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO_USER_POOL_ID,
        userPoolClientId: COGNITO_CLIENT_ID,
      },
    },
  });
}

export type SignInFlowResult =
  | { status: 'SIGNED_IN'; user: AuthUser }
  | { status: 'NEW_PASSWORD_REQUIRED'; missingAttributes?: string[] };

export const authService = {
  /**
   * 自分専用ロックダウン本番モード（Cognito設定済み & VITE_USE_MOCK=false）かどうか
   */
  isMockConfigured(): boolean {
    return USE_MOCK_DEFAULT;
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * AWS Amplify (fetchAuthSession) から最新の有効な JWT (IDトークン) を取得する
   */
  async getValidIdToken(): Promise<string> {
    const current = this.getCurrentUser();
    if (!current) {
      throw new Error('ログインが必要です。');
    }
    if (current.isMock) {
      return current.idToken;
    }

    try {
      const session = await fetchAuthSession();
      const freshIdToken = session.tokens?.idToken?.toString();
      if (freshIdToken) {
        if (freshIdToken !== current.idToken) {
          const updated: AuthUser = { ...current, idToken: freshIdToken };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return freshIdToken;
      }
    } catch {
      // セッション取得失敗時はキャッシュ済みトークンにフォールバック
    }
    return current.idToken;
  },

  /**
   * AWS Cognito (Amplify Auth) でサインインを実行し、
   * CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED の場合はステータスを返してパスワード設定画面へ遷移させる
   */
  async signIn(
    email: string,
    password: string,
    forceMock = false
  ): Promise<SignInFlowResult> {
    if (forceMock || USE_MOCK_DEFAULT) {
      const mockUser: AuthUser = {
        userId: 'demo-user-001',
        email: email || 'demo@fit-tracker.local',
        idToken: 'mock-jwt-token',
        isMock: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
      return { status: 'SIGNED_IN', user: mockUser };
    }

    const cleanEmail = email.trim();

    let result;
    try {
      result = await amplifySignIn({
        username: cleanEmail,
        password,
      });
    } catch (err) {
      // 既にサインインセッションが残っていた場合のみ signOut して再試行
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already a signed in user') || msg.includes('UserAlreadyAuthenticated')) {
        await amplifySignOut();
        result = await amplifySignIn({
          username: cleanEmail,
          password,
        });
      } else {
        throw err;
      }
    }

    if (
      result.nextStep?.signInStep ===
      'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
    ) {
      return {
        status: 'NEW_PASSWORD_REQUIRED',
        missingAttributes: result.nextStep.missingAttributes,
      };
    }

    if (!result.isSignedIn) {
      throw new Error(
        `追加の認証ステップが要求されました: ${result.nextStep?.signInStep}`
      );
    }

    const user = await this._finalizeAmplifySession(cleanEmail);
    return { status: 'SIGNED_IN', user };
  },

  /**
   * FORCE_CHANGE_PASSWORD (CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED) のユーザーに対し
   * confirmSignIn({ challengeResponse: newPassword }) を実行する。
   * 万が一 Cognito チャレンジセッションが期限切れ (Invalid session / session is expired) になっていた場合は、
   * 自動的に仮パスワードで再 signIn して新しいセッションを確立した上で confirmSignIn を完了させる。
   */
  async completeNewPassword(
    email: string,
    tempPassword: string,
    newPassword: string
  ): Promise<AuthUser> {
    const cleanEmail = email.trim();

    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (!result.isSignedIn) {
        throw new Error(
          `パスワード変更後の追加ステップが必要です: ${result.nextStep?.signInStep}`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Cognito の一時セッション期限切れまたは紛失時は、仮パスワードで再認証して即座に confirmSignIn をリトライ
      if (
        tempPassword &&
        (msg.toLowerCase().includes('session') ||
          msg.toLowerCase().includes('expired') ||
          msg.toLowerCase().includes('signIn was not called'))
      ) {
        const reSignIn = await amplifySignIn({
          username: cleanEmail,
          password: tempPassword,
        });
        if (
          reSignIn.nextStep?.signInStep ===
          'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
        ) {
          const retryResult = await confirmSignIn({
            challengeResponse: newPassword,
          });
          if (!retryResult.isSignedIn) {
            throw new Error('新しいパスワードの設定を完了できませんでした。');
          }
        } else if (!reSignIn.isSignedIn) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    return this._finalizeAmplifySession(cleanEmail);
  },

  async _finalizeAmplifySession(email: string): Promise<AuthUser> {
    const session = await fetchAuthSession();
    const idTokenObj = session.tokens?.idToken;
    const idToken = idTokenObj?.toString();

    if (!idToken) {
      throw new Error('Cognito から JWT (IDトークン) を取得できませんでした。');
    }

    const sub = String(idTokenObj?.payload?.sub || 'cognito-user');
    const user: AuthUser = {
      userId: sub,
      email,
      idToken,
      isMock: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    if (!USE_MOCK_DEFAULT) {
      try {
        await amplifySignOut();
      } catch {
        // ignore
      }
    }
  },
};
