# タスク: Google Books APIキーの導入

## 1. APIキーの準備 (ユーザー作業)
- [x] Google Cloud Consoleでプロジェクトを作成する
- [x] 「Google Books API」を有効化する
- [x] 認証情報（APIキー）を作成し、キーを取得する

## 2. 環境変数の設定 (ユーザー・AI作業)
- [x] `frontend/.env` に `VITE_GOOGLE_BOOKS_API_KEY=取得したキー` を追記する
- [x] `frontend/.env.example` に `VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here` を追記する
- [ ] VercelのSettings > Environment Variables に同環境変数を設定する

## 3. アプリケーションコードの改修 (AI作業)
- [x] `AdminBooks.tsx` の `handleFetchIsbn` メソッド内、Google Books APIのfetch URLクエリに `&key=${apiKey}` を付与するよう修正する

## 4. 動作確認 (ユーザー作業)
- [ ] ローカル環境、またはVercel本番環境でのデプロイ後、ISBN検索が429エラーにならずに取得できることを確認する
