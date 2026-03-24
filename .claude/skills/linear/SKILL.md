---
name: linear
description: Linearタスクのステータス管理（In Progress / In Review への自動遷移）
---

# Linear タスクハンドリング

Linear の issue ステータスを作業フェーズに応じて自動更新するスキル。

## 使い方

```
/linear start <issue-id>   # 着手開始 → In Progress に移動
/linear review <issue-id>  # PR作成済み → In Review に移動
```

- `<issue-id>` は Linear の識別子（例: `MIR-123`）

## 実行手順

### `/linear start <issue-id>`

1. `mcp__linear__get_issue` で issue の現在のステータスを確認
2. `mcp__linear__update_issue` で state を `In Progress` に更新
3. issue のタイトルと更新結果をユーザーに報告

### `/linear review <issue-id>`

1. `mcp__linear__get_issue` で issue の現在のステータスを確認
2. `mcp__linear__update_issue` で state を `In Review` に更新
3. issue のタイトルと更新結果をユーザーに報告

## 既存ワークフローとの連携

### 作業着手時
タスクに取りかかる際に `/linear start MIR-123` を実行する。worktree 作成やブランチ切り替えと合わせて使う。

### PR作成時
`gh pr create` の実行後に `/linear review MIR-123` を実行する。PR の URL を Linear issue にリンクとして添付する：

```
mcp__linear__update_issue で links パラメータに PR の URL を追加
```

### 完了時（自動）
PRマージ時は Linear 側の設定により自動で QA ステータスに遷移するため、手動操作は不要。

## MCP ツール参照

使用する Linear MCP ツール:

| ツール | 用途 |
|--------|------|
| `mcp__linear__get_issue` | issue の詳細・現在ステータス取得 |
| `mcp__linear__update_issue` | issue のステータス更新 |
| `mcp__linear__list_issue_statuses` | チームのステータス一覧取得 |

## ステータス一覧（みらい議会チーム）

| ステータス | タイプ |
|-----------|--------|
| Backlog | backlog |
| Todo | unstarted |
| In Progress | started |
| In Review | started |
| QA | started |
| Done | completed |
| Canceled | canceled |

## 注意事項

- `mcp__linear__` のツールが認証切れの場合は `mcp__claude_ai_Linear__` 系のツールをフォールバックとして使用する
- issue ID が不明な場合は `mcp__linear__list_issues` でチームの issue を検索して特定する
- ステータス変更前に現在のステータスを確認し、既に目的のステータスの場合はスキップする
