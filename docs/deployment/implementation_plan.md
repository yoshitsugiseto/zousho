# 本番環境へのデプロイ計画 (Deployment Plan)

## Goal Description
ローカル環境で開発してきた「蔵書管理アプリ（Zousho）」をインターネット上に公開し、実際のユーザーがアクセスできるようにします。
アプリは「バックエンド（データベース・認証機能・Edge Functions）」と「フロントエンド（画面）」の2つに分かれており、それぞれを本番環境にデプロイする必要があります。

**推奨構成**:
- **バックエンド**: Supabase Cloud (公式のホスティングサービス)
- **フロントエンド**: Vercel (React/Viteアプリのホスティングに最も適した無料枠のあるサービス)

---

## User Review Required
> [!IMPORTANT]
> デプロイ作業には、ユーザーご自身のアカウント作成やブラウザ上での設定作業が多く含まれます。以下の手順は【ユーザーが手動で行う作業】と【AI（私）がターミナルを使って代行できる作業】に分かれます。
> 
> **確認事項**:
> - フロントエンドのホスティング先は **Vercel** でよろしいでしょうか？（その他の候補: Netlify, Cloudflare Pages 等）
> - Supabase Cloud へのアカウント登録とプロジェクト作成は実施済みでしょうか？
> - 下記の手順をご確認いただき、私がCLI経由でサポートしながら進めるか、ご自身でドキュメントを見ながら進められるかをご判断ください。

---

## 導入手順（Proposed Steps）

### 1. バックエンド (Supabase Cloud) のデプロイ
1. **プロジェクト作成（ユーザー手動）**
   - [Supabase公式サイト](https://supabase.com/) にログインし、新しいプロジェクトを作成します。
   - プロジェクトURLとAPIキー（anon / service_role）、データベースのパスワードを控えておきます。
2. **Supabase CLIのログインとリンク（AI + ユーザー）**
   - ローカル環境で `npx supabase login` を実行して認証します。
   - 作成したプロジェクトとローカルを紐付けます (`npx supabase link --project-ref <プロジェクトのReference ID>`)。
3. **データベース・マイグレーションのプッシュ（AI実施）**
   - ローカルのテーブルやポリシー設定を本番環境へ反映します (`npx supabase db push`)。
4. **Edge Functionsのデプロイ（AI実施）**
   - ユーザー招待などに使っているAPI関数を反映します (`npx supabase functions deploy admin-user-management`)。
5. **環境変数の設定（AI実施）**
   - Edge Functionが動くように、本番の `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` をコマンドから設定します。
6. **本番の認証・メール設定（ユーザー手動）**
   - Supabaseのダッシュボード（Authentication > URL Configuration）から、Site URLをデプロイ後のフロントエンドURL（後述のVercelのURL）に変更します。
   - 「Authentication > Providers > Email」から、MFAの設定漏れがないかなどを確認します。

### 2. フロントエンド (Vercel) のデプロイ
1. **GitHubリポジトリの作成（ユーザー手動 / 推奨）**
   - コードをGitHubにプッシュしておくことで、Vercelとの連携が非常にスムーズになります。
2. **Vercelプロジェクトの作成と連携（ユーザー手動）**
   - [Vercel](https://vercel.com/) にログインし、GitHubリポジトリを選択してインポートします。
3. **環境変数（Environment Variables）の設定（ユーザー手動）**
   - Vercelのデプロイ設定画面にて、以下の環境変数を設定します：
     - `VITE_SUPABASE_URL`: Supabase本番のURL
     - `VITE_SUPABASE_ANON_KEY`: Supabase本番のanonキー
4. **デプロイの実行**
   - Vercel上でDeployボタンを押す（またはGitHubへPushする）ことで自動的にビルドされ公開されます。

---

## Verification Plan

### 自動デプロイとビルドの確認
- `npm run build` がVercel上でエラーなく完了すること。

### 手動機能テスト (Manual Verification)
本番環境のURL発行後、以下のテストを実施します。
1. **本番環境へのアクセス**: 発行されたURLにアクセスし、ログイン画面が表示されるか。
2. **招待・認証のテスト**: 管理者ユーザーとしてログイン可能か。また、新規ユーザーを招待し、受信したメールのリンクから正しく本番環境のパスワード設定画面に遷移できるか。
3. **MFAとAPIのテスト**: 2段階認証が本番でも動作すること。書籍管理のAPIが正しくデータを保存・取得できること。
