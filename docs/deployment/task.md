# タスクリスト: 本番環境へのデプロイ

## バックエンド (Supabase Cloud)
- [ ] ユーザー: Supabaseダッシュボードで新規プロジェクトを作成する
- [ ] AI: `npx supabase login` でCLIログイン（トークンが必要な場合はユーザーが発行）
- [ ] AI: `npx supabase link --project-ref <REF>` でローカルプロジェクトと紐付け
- [ ] AI: `npx supabase db push` でスキーマとRLSポリシーを本番へ反映
- [ ] AI: `npx supabase functions deploy admin-user-management` でEdge Functionをデプロイ
- [ ] AI: 本番のEdge Functionへ環境変数（`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`）を設定する
- [ ] ユーザー: Supabaseの本番ダッシュボードで、招待メールのSite URL設定と、MFA（TOTP）設定をオンにする

## フロントエンド (Vercel)
- [ ] ユーザー: GitHubにZoushoリポジトリをPushする
- [ ] ユーザー: Vercelにログインし、対象リポジトリをインポートする
- [ ] ユーザー: VercelのEnvironment Variables設定に、本番Supabaseの `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を登録する
- [ ] ユーザー: Vercelでデプロイを実行し、発行されたURLを確認する
- [ ] ユーザー: VercelのURLをSupabaseの `Site URL` と `Redirect URLs` に追加する

## 動作確認 (Verification)
- [ ] ユーザー: アプリにアクセスし、管理者としてログインできるかテストする
- [ ] ユーザー: 本番環境で招待メールが送信され、新規ユーザーとして登録・MFA設定ができるかテストする
