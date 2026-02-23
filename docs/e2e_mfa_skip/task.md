# タスク: E2Eテストの修復（MFAバイパス対応）

## 1. アプリケーションコードの改修 (AI作業)
- [x] `ProtectedLayout.tsx` に `VITE_SKIP_MFA` によるスキップロジックを追加する

## 2. Playwright設定の改善 (AI作業)
- [x] `playwright.config.ts` に `webServer` 設定を追加する

## 3. E2Eテストコードの調整 (AI作業)
- [x] `tests/dashboard.spec.ts` のMFA操作部分を削除またはスキップ対応にする

## 4. 動作確認 (AI作業)
- [x] `VITE_SKIP_MFA=true` を指定して `npx playwright test` を実行し、パスすることを確認する
- [x] 既存の管理画面やダッシュボードの機能が壊れていないか確認する
