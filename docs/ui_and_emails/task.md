# タスク: UI改善および招待メールの日本語化

## 1. アプリケーションコードの改修 (AI作業)
- [x] `Dashboard.tsx` の検索フィルター（タイトル、著者）を大文字小文字無視（`toLowerCase`）にする
- [x] `AdminBooks.tsx` の検索フィルター（タイトル、著者）を大文字小文字無視（`toLowerCase`）にする
- [x] `AdminUsers.tsx` の招待モーダルからInbucket関連の文言を削除する

## 2. 招待メールの日本語化 (ユーザー作業)
- [x] Supabase Dashboardの「Authentication」 > 「Email Templates」 > 「Invite User」を開く
- [x] 件名と本文内容を日本語に変更して保存する

## 3. 動作確認 (ユーザー作業)
- [ ] 大文字小文字の検索フィルターが正常に動作するか確認する
- [ ] 招待モーダルの「Inbucket」の表記が消えているか確認する
- [ ] 実際に招待メールを送り、日本語で届くことを確認する
