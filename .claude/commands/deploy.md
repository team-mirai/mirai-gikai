---
description: "developからmainへのデプロイPRを作成・マージする"
---

## タスク

develop ブランチから main ブランチへのデプロイPRを作成し、確認後にマージします。

### 1. 事前確認

```bash
# 最新の状態をfetch
git fetch origin develop main

# develop と main の差分コミットを確認
git log origin/main..origin/develop --oneline
```

差分コミットがない場合は「デプロイする変更がありません」と報告して終了。

### 2. 差分の詳細表示

```bash
# コミット一覧（詳細）
git log origin/main..origin/develop --pretty=format:"- %h %s (%an)"

# 変更ファイルの統計
git diff origin/main...origin/develop --stat
```

差分の内容をユーザーに報告：
- コミット数
- 変更ファイル数
- 主な変更内容の要約

### 3. デプロイPRの作成

PRタイトルは「本番デプロイ MM/DD HH:MM」の形式（現在日時を使用）。

```bash
gh pr create \
  --base main \
  --head develop \
  --title "本番デプロイ $(date '+%m/%d %H:%M')" \
  --body "$(cat <<'EOF'
## デプロイ内容

<コミット一覧を箇条書きで記載>

## 変更ファイル数

<変更ファイル数を記載>
EOF
)"
```

PRのURLを表示。

### 4. マージ実行

```bash
# 通常マージ（admin権限でマージコミット作成）
gh pr merge --merge --admin
```

### 5. 完了報告

```
デプロイ完了: main ブランチにマージされました
```
