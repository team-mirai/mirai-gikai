---
name: Parallel PR
description: 複数の独立PRをチーム×worktreeで並列作成する。タスク一覧を受け取り、worktree準備→チーム組成→エージェント起動→CI確認→クリーンアップまで一気に実行する。
---

# Parallel PR

複数の独立したPRを、git worktree + エージェントチームで並列に作成するスキル。

## 前提条件

- ユーザーからPR一覧（ブランチ名、対象ファイル、作業内容）が提供されていること
- 提供されていなければ、まずプランモードで一覧を設計し承認を得る

## ワークフロー

### Phase 1: タスク整理

ユーザーの指示からPR一覧を整理する:

```
| # | ブランチ名 | 作業内容 | 対象ファイル |
|---|-----------|---------|-------------|
| 1 | feat/xxx  | ...     | src/...     |
```

PRの数に応じてエージェント数を決める（目安: 4-5が上限）。
1エージェントに1-2 PRを割り当てる。

### Phase 2: worktree準備

エージェントごとにworktreeを作成する:

```bash
# {team} はチーム名の略称（例: test4, refactor2）
# {x} はエージェント識別子（a, b, c, d...）
git worktree add ../mirai-gikai-{team}-{x} -b {team}-{x}-base
mkdir -p ../mirai-gikai-{team}-{x}/.claude
cp .claude/settings.local.json ../mirai-gikai-{team}-{x}/.claude/
```

依存パッケージのインストール（全worktreeをバックグラウンドで並列実行）:

```bash
cd ../mirai-gikai-{team}-{x} && pnpm install --frozen-lockfile
```

### Phase 3: チーム組成＆エージェント起動

1. `TeamCreate` でチームを作成
2. `TaskCreate` で各エージェントのタスクを作成（owner設定、in_progress）
3. `Task` で各エージェントをバックグラウンドで起動:

```
Task(
  subagent_type: "general-purpose",
  team_name: "{チーム名}",
  name: "agent-{x}",
  mode: "bypassPermissions",
  run_in_background: true,
  prompt: 下記テンプレート参照
)
```

#### エージェントプロンプトテンプレート

```
あなはworktree-workerです。以下の手順で作業してください。

## 作業環境
- worktreeパス: {絶対パス}
- 全コマンドはこのworktreeディレクトリ内で実行すること

## 担当PR一覧
### PR 1
- ブランチ名: {branch}
- 作業内容: {description}
- 対象ファイル: {files}

### PR 2 (あれば)
- ...

## 作業手順
1. `git checkout -b {branch} develop` でブランチ作成
2. 対象ファイルを読んで理解
3. 実装・修正
4. 検証（テスト実行 or typecheck）
5. `pnpm lint:fix` でフォーマット
6. コミット（Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>）
7. `git push -u origin {branch}`
8. `gh pr create --base develop --title "{title}" --body "..."`
9. 次のPRがあれば `git checkout -b {next-branch} develop` で次へ
10. 全完了後、リーダーにメッセージで報告（PR番号・URL）
```

### Phase 4: 完了待ち＆CI確認

エージェントからの完了メッセージを待つ。全エージェント完了後:

```bash
# 全PRのCI状態を一括確認
for pr in {PR番号リスト}; do
  echo "=== PR #$pr ==="
  gh pr checks $pr
done
```

```bash
# 全PRのコメントを確認（CodeRabbitやレビューアからのフィードバック）
for pr in {PR番号リスト}; do
  echo "=== PR #$pr comments ==="
  gh pr view $pr --comments
done
```

CI失敗時の対応:
- **TypeScript型エラー**: worktreeで直接修正してpush
- **Biomeエラー**: worktreeで `pnpm lint:fix` して再push
- **テスト失敗**: worktreeで修正して再push

PRコメント対応:
- **CodeRabbitの指摘**: 重要な指摘はworktreeで修正してpush
- **軽微な指摘（nitpick等）**: マージ後に対応するか、必要に応じて対応

### Phase 5: クリーンアップ

```bash
# 全エージェントにシャットダウン要求
SendMessage(type: "shutdown_request", recipient: "agent-{x}")

# worktree削除
git worktree remove ../mirai-gikai-{team}-{x}
git branch -D {team}-{x}-base

# チーム削除
TeamDelete
```

### Phase 6: ユーザーに結果報告

作成したPR一覧をまとめて報告:

```
| # | PR | タイトル | CI |
|---|-----|---------|-----|
| 1 | #XX | feat: ... | Passed |
```

## 注意事項

- エージェント数は4-5が実用的上限（APIレート制限、CI負荷）
- CIのflaky testに注意 → 失敗時はログ確認してから再実行
- worktreeパスは `../mirai-gikai-{name}` 形式
- `settings.local.json` のコピーは必須（権限設定のため）
