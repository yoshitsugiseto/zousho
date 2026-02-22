# 蔵書管理システム - 実装計画 (Supabase構成)

## ゴール
コミュニティ（社内・家族など）での利用を前提とした「蔵書管理システム」のプロトタイプ構築に向けた基本設計、および技術スタックの定義と初期環境構築のロードマップを作成します。

## 対象ユーザーとスコープ
*   **ターゲット**: 管理者および一般ユーザー（コミュニティメンバー）
*   **コア機能**:
    *   【管理者】書籍情報の登録（冊数含む）・編集・削除
    *   【共通】書籍の一覧表示、検索機能
*   **状態管理**:
    *   【共通】本の在庫・貸出状況の確認
    *   【ユーザー】個人の読書状況（未読、読書中、読了）の管理
    *   【共通】貸出管理（誰に貸し出されているか）※返却予定日は対象外

## 技術スタック (案B-1: Supabase構成)
*   **フロントエンド**: React (Vite) + Tailwind CSS + TypeScript
    *   ホスティング: Cloudflare Pages または Vercel
*   **バックエンド / データベース**: **Supabase** (PostgreSQL)
    *   認証: Supabase Auth (Email/Password)
    *   API: Supabase Client (PostgREST経由の直接DBアクセス)
    *   ファイルストレージ: Supabase Storage (表紙画像用)

---

## データベーススキーマ設計（概案）

### 1. `users` (Supabase Auth の `auth.users` に紐づく拡張テーブル)
*   `id` (UUID, PK) - auth.users.id と一致
*   `role` (String) - 'admin' or 'user'
*   `display_name` (String)
*   `email` (String) - auth.users.email と同期。UI表示等で使用するため保持

### 2. `books` (書籍マスタ)
*   `id` (UUID, PK)
*   `title` (String) - 書籍名
*   `author` (String) - 著者名
*   `isbn` (String, nullable) - ISBNコード
*   `cover_url` (String, nullable) - 表紙画像のURL
*   `total_copies` (Integer) - 所持（登録）冊数

### 3. `book_items` (物理的な1冊ごとの管理)
複数冊同じ本がある場合、誰がどの実体を借りているかをトラッキングするためのテーブル。
*   `id` (UUID, PK)
*   `book_id` (UUID, FK -> books)
*   `status` (String) - 'available' (在庫あり), 'borrowed' (貸出中), 'lost' (紛失)

### 4. `loans` (貸出記録 - 現在の貸出ステータス)
*   `id` (UUID, PK)
*   `book_item_id` (UUID, FK -> book_items)
*   `user_id` (UUID, FK -> users) - 借りているユーザー
*   `borrowed_at` (Timestamp) - 貸出日時
*   `returned_at` (Timestamp, nullable) - 返却日時（NULLなら貸出中）

### 5. `reading_statuses` (ユーザー個人の読書状況)
*   `id` (UUID, PK)
*   `user_id` (UUID, FK -> users)
*   `book_id` (UUID, FK -> books)
*   `status` (String) - 'unread', 'reading', 'read'

---

## ロードマップ（今後のフェーズ）

### フェーズ1: 基盤構築
*   Supabaseプロジェクトの作成
*   上記のデータベーステーブル構築とRLS (Row Level Security) の設定
*   （管理者は全操作可能、一般ユーザーは閲覧および自分に関連する操作のみ可能）

### フェーズ2: コア機能実装 (API & UI)
*   フロントエンド環境 (Vite + React) のセットアップ
*   Supabase Auth を用いたログイン画面の実装
*   【管理者】書籍マスタ（`books` / `book_items`）のCRUD画面
*   【共通】蔵書一覧・検索画面の作成

### フェーズ3: ステータス・貸出管理実装
*   【共通】書籍詳細画面からの貸出・返却アクション（`loans`の更新）
*   【ユーザー】マイページまたは詳細画面での読書状況（`reading_statuses`）の更新

### フェーズ4: テスト実装
*   **単体テスト (Unit Test)**:
    *   Vitest または Jest を導入
    *   UIコンポーネント（ボタン、リストなど）のレンダリングテスト
    *   Supabase等のデータ取得ロジック（カスタムフックなど）のロジックテスト
*   **E2Eテスト (End-to-End Test)**:
    *   Playwright を導入
    *   ログインフロー 〜 書籍の登録 〜 貸出 〜 返却という一連のユーザーシナリオの通しテスト
    *   権限（管理者/ユーザー）による画面表示・操作可否のテスト

## 確認事項
上記の内容でプロジェクトの「基盤となる仕様」としてよろしいでしょうか？
問題なければ、この内容に基づいて開発プロジェクトの初期化（`docs/` へのファイル出力など）を進める準備が整います。
