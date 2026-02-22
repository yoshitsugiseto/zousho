# タスクリスト: アプリ内ユーザーマニュアルの追加

- [x] `frontend/src/pages/Manual.tsx` を新規作成し、非エンジニア向けの各種手順（初期ログイン、2段階認証、ダッシュボードでの貸出・返却など）を丁寧に記載する。
- [x] `frontend/src/App.tsx` に新しく `<Route path="/manual" element={<Manual />} />` を追加する。
- [x] `frontend/src/components/ProtectedLayout.tsx` のヘッダーナビゲーションに「マニュアル」のリンクを追加する。
- [x] ローカル環境でマニュアル画面に遷移でき、正しく表示・閲覧できることを確認する。
