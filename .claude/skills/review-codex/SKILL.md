---
name: review-codex
description: Codex CLIを使って現在の変更差分のコードレビューを取得する
---

# Review with Codex

Codex CLI の `codex review` コマンドで、現在の変更に対するコードレビューを取得するスキル。

## 使い方

引数なしで実行すると、develop ブランチとの差分をレビューする。

```
/review-codex
/review-codex "セキュリティ面を重点的にチェックして"
```

## ワークフロー

### Step 1: 差分の確認

まず現在のブランチと変更内容を確認する:

```bash
git branch --show-current
git diff --stat develop...HEAD
```

変更がない場合はユーザーに通知して終了。

### Step 2: Codex Review の実行

ユーザーから追加の指示（引数）があればそれを PROMPT として渡す。

```bash
# 引数なしの場合
codex review --base develop

# 引数ありの場合（例: "セキュリティ面を重点的にチェック"）
codex review --base develop "{ユーザーの指示}"
```

コマンドのタイムアウトは5分（300000ms）に設定する。

### Step 3: 結果の報告

Codex の出力をそのままユーザーに表示する。

## 注意事項

- `codex` CLI がインストール済みであること（`/opt/homebrew/bin/codex`）
- レビュー対象はデフォルトで `develop` ブランチとの差分
- `--base` オプションで比較対象を変更可能
