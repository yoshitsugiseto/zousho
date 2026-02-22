# 実装計画: Google Books APIのキー利用

## Goal Description
Zoushoアプリケーションの書籍登録機能において、Google Books APIの利用制限（HTTP 429 Too Many Requests）を回避するため、APIキーを発行・組み込み、確実な書籍情報の取得を実現します。
今回修正する「APIキー付きのGoogle Books API」をメインとして利用しつつ、Google Books APIで見つからなかった場合のフォールバック（第2の検索先）として「OpenBD API」を呼び出す仕組みを構築します。

---

## User Review Required
> [!IMPORTANT]
> APIキーの発行については、セキュリティ上の理由から**ユーザー様ご自身でGoogle Cloud Consoleを操作していただく必要**があります。
> 発行したAPIキーは、アプリケーションに組み込むための「環境変数」として保存します。
>
> 以下の手順をご確認いただき、APIキーの発行と設定に進んでよろしいでしょうか？

---

## Proposed Changes

### 1. APIキーの発行（ユーザー手動）
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセスし、新しいプロジェクトを作成（または既存のプロジェクトを選択）します。
2. 左上メニューの「APIとサービス」 > 「ライブラリ」から `Google Books API` を検索し、**有効化 (Enable)** します。
3. 「認証情報 (Credentials)」画面へ進み、「認証情報を作成」 > 「APIキー」を選択します。
4. 発行された「APIキー」をコピーしておきます。
   - *(推奨: セキュリティのため、キーの制限（APIの制限）から「Google Books API」のみを許可するように設定することをおすすめします)*

### 2. 環境変数の設定
1. **ローカル環境**: コピーしたAPIキーを、フロントエンドの `.env` ファイルに追記します。
   ```env
   VITE_GOOGLE_BOOKS_API_KEY=AIzaSyxxxxxxxxxxxxx
   ```
2. **本番環境 (Vercel)**: Vercelのプロジェクト設定（Settings > Environment Variables）を開き、同じ変数名 (`VITE_GOOGLE_BOOKS_API_KEY`) とAPIキーの値を登録し、再度デプロイ (Redeploy) を実行します。

### 3. フロントエンドの実装変更
#### [MODIFY] `frontend/src/pages/AdminBooks.tsx`
Google Books APIを呼び出す箇所で、環境変数から抽出したAPIキー（`?key=${apiKey}`）をURLパラメータとして付与するように改修します。

- 変更前: 
  `fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:${newIsbn}')`
- 変更後: 
  `fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:${newIsbn}&key=${apiKey}')`

---

## Verification Plan

### Manual Verification
1. ローカルの `.env` ファイルに取得したAPIキーを設定し、`npm run dev` でローカルサーバーを起動する。
2. 「書籍管理」の「ISBNから情報取得して登録」にて、**OpenBDには存在しないがGoogle Booksには存在するISBN**（洋書やマイナーな書籍など）を入力して「取得」ボタンを押す。
3. ブラウザの開発者ツールの「Network」タブを開き、Google Books APIへのリクエストURLに `?key=AIzaSy...` が付与されていること、レスポンスが200 OK（書籍情報）として返ってくることを確認する。
4. 429エラーが発生せず、安定して書籍情報が取得できることを確認する。
