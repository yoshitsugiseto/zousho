# タスクリスト: ユーザープロフィール拡充とUI改善

- [x] `supabase/functions/admin-user-management/index.ts` の `invite` アクションを改修し、受け取った `displayName` を `public.users` に保存する処理を追加。
- [x] `frontend/src/pages/AdminUsers.tsx` の招待モーダルに「名前（表示名）」入力欄を追加し、API呼び出し時に引数として渡す。
- [x] `frontend/src/components/ProtectedLayout.tsx` を修正し、マニュアルリンクの配置をナビゲーションの右端（「ユーザー管理」の右）に移動する。
- [x] `frontend/src/pages/AdminBooks.tsx` を修正し、`loans` に関連する `users` テーブルのデータ取得に `display_name` を含める。
- [x] 同様に `AdminBooks.tsx` の画面表示部で、貸出中のユーザーとして `display_name` を優先して表示するようにする。
