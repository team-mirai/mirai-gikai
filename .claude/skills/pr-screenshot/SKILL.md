---
name: pr-screenshot
description: UI変更を含むPRで、agent-browserでスクリーンショットを撮影し、R2にアップロードしてPR本文に貼り付ける
---

# PR Screenshot

UI変更を含むPRのスクリーンショットを自動で撮影・アップロード・PR本文更新するスキル。

## 使い方

```
/pr-screenshot
/pr-screenshot "ホバー状態も撮って"
```

引数なしで実行すると、変更差分からUI変更対象ページを自動判断する。

## 設定

R2の接続情報はローカル設定ファイル `.claude/skills/pr-screenshot/config.local.json` から読み取る（gitignore対象）。

```json
{
  "r2AccountId": "your-cloudflare-account-id",
  "r2Bucket": "your-bucket-name",
  "r2PublicUrl": "https://pub-xxx.r2.dev"
}
```

**初回セットアップ**: このファイルが存在しない場合、スキル実行時にユーザーに値を聞いて作成する。

```
SCREENSHOT_DIR=/tmp/pr-screenshots
```

## ワークフロー

### Step 1: 変更差分の分析

現在のブランチとPR番号を特定する:

```bash
git branch --show-current
gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number'
git diff --name-only develop...HEAD
```

変更されたファイルパスから、影響を受けるUI画面を推定する:

**推定ルール**:
- `web/src/features/{feature}/` → その feature に対応するページ
- `web/src/app/(main)/bills/` → 議案詳細ページ (`/bills/{id}`)
- `web/src/app/(main)/page.tsx` → トップページ (`/`)
- `web/src/app/(main)/kokkai/` → 国会会期ページ
- `web/src/components/` → 影響範囲が広い。トップページ + 議案詳細を撮る
- `admin/src/features/bills-edit/` → admin 議案編集ページ
- `admin/src/features/bills/` → admin 議案一覧ページ
- `web/src/app/globals.css` → トップページ + 議案詳細を撮る
- `admin/src/app/` 配下 → 対応する admin ページ

feature名からページを特定する対応表:
- `bills` → `/bills/{id}` (議案詳細)
- `interview-config` → `/bills/{id}/interview` (インタビューLP)
- `interview-session` → `/bills/{id}/interview/chat` (チャット)
- `interview-report` → `/report/{reportId}` (レポート)
- `bill-difficulty` → `/bills/{id}` (議案詳細)

**UIに関係しない変更のみの場合**（migration, test, server-only logic等）はスキップして終了。

### Step 2: 環境セットアップ

worktreeのパスを特定し（現在のディレクトリが worktree であることを前提）、devサーバーを起動する:

```bash
# Supabase が起動中か確認
npx supabase status 2>&1 | head -5

# シードデータを投入（新カラム等を反映）
pnpm seed

# devサーバー起動（バックグラウンド）
# web のみ: ポート3000
# admin も必要なら: ポート3001
npx dotenv -e .env -- pnpm --filter web run dev &
# admin が必要な場合:
# npx dotenv -e .env -- pnpm --filter admin run dev &

# サーバー起動待ち
sleep 8
```

サーバーが起動したら、使用するポートを確認する（3000が使用中なら別ポートが割り当てられる）:

```bash
# 起動ログからポートを確認するか、curl で確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || curl -s -o /dev/null -w "%{http_code}" http://localhost:3002
```

### Step 3: スクリーンショット対象URLの構築

seed投入後、DBから議案IDを取得してURLを構築する:

```bash
# 公開済み議案のIDを1件取得
npx supabase db query "SELECT id::text FROM bills WHERE publish_status = 'published' LIMIT 1;"
```

取得したIDを使い、Step 1 で特定したページのURLリストを作る。

admin ページが対象の場合:
```bash
# admin にログインが必要（session cookie取得）
# admin は Basic Auth やメールログインが必要なので、URL直アクセスで取れない場合がある
# → admin はログインフローを agent-browser で実行してからスクショを撮る
```

### Step 4: スクリーンショット撮影

`agent-browser` でモバイルビューポート (390x844) でスクリーンショットを撮る。

```bash
mkdir -p /tmp/pr-screenshots

# セッション名はPR番号を使う
SESSION="pr-${PR_NUMBER}"

# ビューポートをモバイルに設定
agent-browser --session $SESSION set viewport 390 844

# 各URLを開いてスクショ
agent-browser --session $SESSION open "$URL"
agent-browser --session $SESSION wait 3000
agent-browser --session $SESSION screenshot /tmp/pr-screenshots/screenshot-1.png
```

**注意点**:
- ページ読み込み後 `wait 3000` で安定を待つ
- 初回アクセスはコンパイルに時間がかかるので `open` がタイムアウトしたらリトライする
- ツールチップやホバー状態が必要な場合は `hover` してから撮る
- スクロールが必要な場合は `scroll down` してから撮る
- 撮影後は `Read` ツールで画像を確認し、正しく表示されているか検証する

**admin ページのログインフロー**:
```bash
agent-browser --session $SESSION open "http://localhost:3001/login"
agent-browser --session $SESSION snapshot -i
# メールとパスワードを入力
agent-browser --session $SESSION fill "@eX" "admin@example.com"
agent-browser --session $SESSION fill "@eY" "admin123456"
agent-browser --session $SESSION click "@eZ"  # ログインボタン
agent-browser --session $SESSION wait 3000
# ログイン後、目的のページに遷移
```

### Step 5: R2 アップロード

まず wrangler の認証状態を確認する:

```bash
npx wrangler whoami 2>&1
```

「Not authenticated」等のエラーが出た場合、ユーザーに `! npx wrangler login` の実行を促す（ブラウザでのOAuth認証が必要なため、Claude側では実行できない）。認証が完了するまでこのステップを中断する。

`config.local.json` から設定を読み取ってアップロードする。

```bash
# config.local.json から値を取得（Bash の jq または Read ツールで読む）
R2_ACCOUNT_ID=$(cat .claude/skills/pr-screenshot/config.local.json | jq -r '.r2AccountId')
R2_BUCKET=$(cat .claude/skills/pr-screenshot/config.local.json | jq -r '.r2Bucket')
R2_PUBLIC_URL=$(cat .claude/skills/pr-screenshot/config.local.json | jq -r '.r2PublicUrl')

export CLOUDFLARE_ACCOUNT_ID=$R2_ACCOUNT_ID

# PR番号ベースのパスでアップロード
npx wrangler r2 object put "${R2_BUCKET}/pr-${PR_NUMBER}/screenshot-1.png" \
  --file /tmp/pr-screenshots/screenshot-1.png --remote

# 複数ファイルがある場合はそれぞれアップロード
```

公開URLのパターン:
```
${R2_PUBLIC_URL}/pr-${PR_NUMBER}/screenshot-1.png
```

### Step 6: PR 本文にスクリーンショットを追加

`gh pr edit` でPR本文を更新する。既存の本文を取得し、スクリーンショットセクションを追加/更新する。

スクリーンショットが3枚以下の場合はテーブルで横並び（33%幅）:

```markdown
## スクリーンショット

| 説明1 | 説明2 | 説明3 |
|:---:|:---:|:---:|
| <img src="URL1" width="250" /> | <img src="URL2" width="250" /> | <img src="URL3" width="250" /> |
```

4枚以上の場合は2列テーブル:

```markdown
## スクリーンショット

| 説明1 | 説明2 |
|:---:|:---:|
| <img src="URL1" width="350" /> | <img src="URL2" width="350" /> |
| <img src="URL3" width="350" /> | <img src="URL4" width="350" /> |
```

既存のPR本文に `## スクリーンショット` セクションがある場合は置換する。ない場合は `## Test plan` の直前に挿入する。

### Step 7: クリーンアップ

```bash
# devサーバーを停止
pkill -f "next dev.*turbopack" 2>/dev/null

# 一時ファイル削除
rm -rf /tmp/pr-screenshots
```

## 注意事項

- `agent-browser` CLI がインストール済みであること
- `npx wrangler` が認証済みであること（未認証の場合、ユーザーに `! npx wrangler login` を促す）
- Supabase がローカルで起動中であること（`npx supabase start`）
- seed データには固定IDがないため、DBクエリでIDを取得する
- Next.js の `unstable_cache` により、seed直後でもキャッシュが効く場合がある。`.next` フォルダ削除 + サーバー再起動で解決する
- admin ページは認証が必要。seed データの `admin@example.com / admin123456` でログインする
