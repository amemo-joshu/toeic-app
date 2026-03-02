# 🎯 TOEIC 700+ マスター

TOEIC 700点以上を目指す人のためのWebアプリ。  
複数ユーザー対応、問題練習・単語学習・スコア予測・ランキングを完備。

---

## 機能

- **認証**: メール＋パスワードで登録/ログイン（管理者/一般ユーザー）
- **問題練習**: Part 5（短文穴埋め）、Part 6（長文穴埋め）、Part 7（読解）
- **単語学習**: スペース反復法（SRS）フラッシュカード、50単語収録
- **進捗分析**: パート別正答率レーダーチャート、セッション履歴グラフ
- **スコア予測**: 正答率から推定TOEICスコアを算出
- **ランキング**: 全ユーザーのスコアランキング
- **管理者パネル**: ユーザー管理、問題追加・管理

---

## セットアップ

### 1. リポジトリをクローン
```bash
git clone <repo-url>
cd toeic-app
```

### 2. パッケージインストール
```bash
npm install
```

### 3. 環境変数設定
`.env` ファイルを編集:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"  # 本番は強力なランダム文字列に変更
NEXTAUTH_URL="http://localhost:3000"    # 本番はドメインに変更
```

### 4. データベースセットアップ（自動でシードデータも投入）
```bash
npx prisma migrate dev --name init
```

### 5. 開発サーバー起動
```bash
npm run dev
```

http://localhost:3000 でアクセス

---

## デフォルトアカウント

| 種別 | メール | パスワード |
|------|--------|-----------|
| 管理者 | admin@toeic.com | admin123456 |
| デモユーザー | demo@toeic.com | demo12345 |

⚠️ **本番環境では必ずパスワードを変更してください**

---

## 本番デプロイ（VPS）

### 必要環境
- Ubuntu 22.04+
- Node.js 20+
- PostgreSQL（オプション、SQLiteのままでも可）

### PostgreSQLに切り替える場合
1. `prisma/schema.prisma` の `provider = "sqlite"` を `"postgresql"` に変更
2. `.env` の `DATABASE_URL` をPostgreSQL接続文字列に変更:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/toeic_db"
   ```
3. `npx prisma migrate dev --name init`

### PM2で起動
```bash
npm run build
npm install -g pm2
pm2 start npm --name "toeic-app" -- start
pm2 save
pm2 startup
```

### Nginx設定例
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS v4
- **認証**: NextAuth.js v5
- **ORM**: Prisma v5
- **DB**: SQLite（開発）/ PostgreSQL（本番推奨）
- **グラフ**: Recharts

---

## 問題の追加方法

管理者アカウントでログイン → `/admin` → 「問題追加」タブから追加できます。

---

## ライセンス

MIT
