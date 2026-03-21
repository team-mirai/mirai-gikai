---
name: review
description: コードレビューとテストガイドラインチェックを同時実行する
---

# Review

コードレビューとテストガイドラインチェックを**同時に実行**するセルフレビュースキル。

## 使い方

引数なしで実行すると、develop ブランチとの差分をレビューする。

```
/review
/review "セキュリティ面を重点的にチェックして"
```

## ワークフロー

### Step 1: 差分の確認

まず現在のブランチと変更内容を確認する:

```bash
git branch --show-current
git diff --stat develop...HEAD
```

変更がない場合はユーザーに通知して終了。

### Step 2: コードレビューとテストガイドラインチェックを同時実行

以下の2つを **Task ツールで並列に** 起動する:

#### 2a. Codex Review（Bashで実行）

ユーザーから追加の指示（引数）があればそれを PROMPT として渡す。

```bash
# 引数なしの場合
codex review --base develop

# 引数ありの場合（例: "セキュリティ面を重点的にチェック"）
codex review --base develop "{ユーザーの指示}"
```

コマンドのタイムアウトは5分（300000ms）に設定する。

#### 2b. テストガイドラインチェック（Task ツールで実行）

`.claude/agents/test-guidelines-checker.md` の内容に従い、`subagent_type: "general-purpose"` の Task エージェントを起動してテストガイドラインの遵守状況をチェックする。

**重要**: 2a と 2b は必ず並列（同一メッセージ内で複数の Tool call）で実行すること。

### Step 3: 結果の報告

両方の結果をまとめてユーザーに表示する:

1. **Codex Review 結果**: Codex の出力をそのまま表示
2. **テストガイドラインチェック結果**: エージェントの出力をそのまま表示

## 注意事項

- `codex` CLI がインストール済みであること（`/opt/homebrew/bin/codex`）
- レビュー対象はデフォルトで `develop` ブランチとの差分
- `--base` オプションで比較対象を変更可能
- テストガイドラインチェッカーが `.claude/agents/test-guidelines-checker.md` に存在しない場合は Codex Review のみ実行する
