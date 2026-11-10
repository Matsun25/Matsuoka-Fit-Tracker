import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Google ドライブ仮想ドライブのファイルロックを回避するため、
// C:\Users\<user>\AppData\Local\fit-tracker-deps\node_modules もモジュール解決先に含める
const localDepsDir = process.env.LOCALAPPDATA
  ? path.resolve(process.env.LOCALAPPDATA, 'fit-tracker-deps')
  : '';
const localNodeModules = localDepsDir
  ? path.resolve(localDepsDir, 'node_modules')
  : '';

export default defineConfig({
  plugins: [react()],
  // Vite の .vite キャッシュフォルダをローカル C ドライブに退避して Google ドライブのロックを防止
  cacheDir: localDepsDir
    ? path.resolve(localDepsDir, '.vite')
    : undefined,
  resolve: {
    alias: localNodeModules
      ? [
          {
            find: /^@\/(.*)/,
            replacement: path.resolve(__dirname, 'src/$1'),
          },
        ]
      : [],
    // node_modules の探索先にローカル C ドライブを追加
    modules: localNodeModules
      ? ['node_modules', localNodeModules]
      : ['node_modules'],
  },
  server: {
    port: 5173,
    open: false,
    fs: {
      allow: [
        // プロジェクトルート
        path.resolve(__dirname),
        // ローカル C ドライブ側の依存パッケージディレクトリ
        ...(localDepsDir ? [localDepsDir] : []),
      ],
    },
  },
});
