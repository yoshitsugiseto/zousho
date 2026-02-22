<div align="center">
  <img src="https://via.placeholder.com/1200x300.png?text=Zousho+Library+Management+System" alt="Zousho Banner" />

  <h1>📚 Zousho (蔵書管理システム)</h1>

  <p>
    <strong>チームやコミュニティ内の本棚をスマートに管理。</strong><br>
    誰がどの本を借りているか、直感的なUIで瞬時に把握できる蔵書管理アプリケーションです。
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

<br />

## ✨ 主な機能 (Features)

- 📖 **直感的なダッシュボード**: 借りられる本、貸出中の本が一目でわかる「みんなの本棚」
- 🔍 **ISBN自動取得**: バーコード(ISBN)を入力するだけで、Google Books APIからタイトルや表紙画像を自動で取得・登録
- 🔄 **貸出・ステータス管理**: ワンクリックで本を借り、現在の読書状況（未読/読書中/読了）を管理
- 🔒 **セキュアな認証システム**: 招待制のユーザー登録と、Google Authenticator等を使った2段階認証（MFA）を完全サポート
- 👑 **管理者専用ダッシュボード**: 蔵書マスターデータのメンテナンスや、メンバーの招待・権限（一般/管理者）を専用画面で一元管理
- 📱 **レスポンシブデザイン**: PCからでもスマートフォンからでも見やすく操作しやすいモダンなUI構成

---

## 🛠 技術スタック (Tech Stack)

### Frontend
- **Framework**: [React 18](https://reactjs.org/) / TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend (BaaS)
- **Database / Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Functions**: [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno)

---

## 🚀 開発環境の構築 (Getting Started)

本プロジェクトをローカル環境で動かすための手順です。

### 1. 必須要件
- Node.js (v18以上推奨)
- Git
- Docker (Supabaseのローカル実行用)
- Supabase CLI (`npm i -g supabase-cli` 等でインストール)

### 2. リポジトリのクローン

```bash
git clone https://github.com/yoshitsugiseto/zousho.git
cd zousho
```

### 3. バックエンド (Supabase) の起動

Supabase CLIを使用してローカルにコンテナを立ち上げます。

```bash
supabase start
```
> **Note**: 起動完了時に表示される `API URL` と `anon key` をメモしておいてください。

### 4. フロントエンドのセットアップと起動

フロントエンドディレクトリに移動し、依存関係をインストールします。

```bash
cd frontend
npm install
```

環境変数ファイルを作成し、先ほどメモしたキーを設定します。

```bash
cp .env.example .env
```
`.env` ファイルを開き、以下の値を実際のローカルURLとキーに書き換えてください。
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5c...
```

開発サーバーを起動します。
```bash
npm run dev
```

ブラウザで `http://localhost:5173` （または `http://127.0.0.1:5173`）にアクセスしてアプリを確認してください。

---

## 📖 アプリの使い方 (Usage)

アプリ内には非エンジニアの方でも分かりやすい**「使い方（マニュアル）」**ページが組み込まれています。
ログイン後、画面右上のヘッダーメニュー「使い方（マニュアル）」から、機能の操作手順や2段階認証の設定方法をいつでも参照可能です。

---

## ☁️ デプロイ (Deployment)

本番環境の構築には以下を推奨しています。
- **フロントエンド**: [Vercel](https://vercel.com/)
- **バックエンド**: [Supabase Cloud](https://supabase.com/)

詳細なデプロイ手順と計画については `docs/deployment/implementation_plan.md` をご参照ください。

---

## 📄 ライセンス (License)

This project is licensed under the MIT License - see the LICENSE file for details.
