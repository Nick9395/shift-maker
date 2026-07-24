# Shift Maker

シフト管理アプリケーション（開発中）です。  
フロントエンド（React）とバックエンド（Rails API）を Docker Compose で起動します。

## 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | React 19 / TypeScript / Vite / React Router |
| Backend | Ruby 3.4 / Rails 8.1（API mode） |
| 認証 | Devise + devise-jwt（Bearer JWT） |
| DB | PostgreSQL 18 |
| 開発環境 | Docker Compose |

## ディレクトリ構成

```
shift_maker/
├── backend/     # Rails API
├── frontend/    # React (Vite)
├── docs/        # 要件定義などの詳細ドキュメント
├── compose.yaml
└── README.md
```

## 前提条件

- [Docker](https://docs.docker.com/get-docker/) / Docker Compose
- （任意）ホストでフロントの型チェックや IDE 補完を使う場合は Node.js

## 起動方法

リポジトリのルートで実行します。

```bash
docker compose up --build
```

初回はイメージビルドと `bundle install` / `npm install`、DB 準備に時間がかかることがあります。

停止:

```bash
docker compose down
```

DB データも削除する場合:

```bash
docker compose down -v
```

### 起動後の URL

| サービス | URL |
|----------|-----|
| フロントエンド | http://localhost:3001 |
| バックエンド API | http://localhost:3000 |
| PostgreSQL | `localhost:5432`（ユーザー `postgres` / パスワード `password`） |

ヘルスチェック例:

```bash
curl http://localhost:3000/api/v1/health
```

## 主な画面（フロント）

| パス | 内容 |
|------|------|
| `/` | トップ（利用開始 / ログイン / 利用規約） |
| `/signup` | サインアップ（成功時は自動ログインして `/home`） |
| `/login` | ログイン |
| `/password/forgot` | パスワード再設定メール送信 |
| `/password/reset` | 新パスワード設定 |
| `/terms` | 利用規約（仮） |
| `/home` | ログイン後ホーム（業務画面は今後追加） |

## 認証・開発時の注意

- API 認証は JWT（`Authorization: Bearer ...`）です。フロントは `localStorage` に保存します。
- 開発環境のメールは実送信せず、`backend/tmp/mail/` にファイル保存されます。パスワードリセット確認時はここを参照してください。
- CORS はフロント `http://localhost:3001` を許可しています。
- JWT 用シークレットは Compose の `DEVISE_JWT_SECRET_KEY` です（開発用。本番では必ず変更してください）。

## よく使うコマンド

コンテナ内で Rails テスト:

```bash
docker compose exec api bin/rails test
```

コンテナ内でフロントビルド確認:

```bash
docker compose exec web npm run build
```

### ホストで frontend の依存関係を入れる場合

Docker の `node_modules` は名前付きボリュームのため、IDE（TypeScript）がモジュールを解決できないことがあります。ホスト側でも次を実行してください。

```bash
cd frontend
npm install
```

## ドキュメント

- [ユーザー認証 要件定義書](docs/要件定義書_ユーザー認証.md)

## 今後の予定（概要）

- シフト一覧・詳細・編集など業務画面
- 利用規約の正式文面
- 本番向けのメール送信・シークレット管理
