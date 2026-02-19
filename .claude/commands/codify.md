---
description: "指摘事項を修正し、再発防止のルールをCLAUDE.md/skill/commandに仕組み化する"
---

## 引数

$ARGUMENTS

## 現在の状況

- 現在のブランチ: !`git branch --show-current`
- 変更ファイル: !`git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached 2>/dev/null || git diff --name-only`

## タスク

指摘事項（レビューフィードバック、Codex指摘、手動フィードバック等）を修正し、再発防止のためにプロジェクトの仕組みとして定着させてください。

### 1. 指摘事項の収集

引数がある場合はそれを指摘事項として扱う。引数がない場合は以下を自動収集：

- 直近の `/review-codex` や `/review_pr` の出力結果があればそれを参照
- `git diff` から現在の変更内容を確認
- ユーザーに確認が必要な場合は `AskUserQuestion` で聞く

### 2. 指摘事項の分類

各指摘を以下のカテゴリに分類し、一覧表示する：

| カテゴリ | 説明 |
|----------|------|
| **コード修正** | 即座に修正すべきバグ・品質問題 |
| **ルール追加** | CLAUDE.mdに追加すべきコーディング規約・アーキテクチャルール |
| **ワークフロー改善** | skill/commandとして定義すべき繰り返しの作業パターン |
| **ツール設定** | biome/lint/CI等の設定で自動検出できるもの |
| **一過性** | 今回限りの問題で仕組み化不要 |

### 3. コード修正の実施

「コード修正」カテゴリの指摘を修正する：

- 修正前に対象ファイルを読み込み、コンテキストを理解する
- CLAUDE.mdの既存ルールに準拠した修正を行う
- 修正後に `pnpm lint` と `pnpm typecheck` で検証する

### 4. 仕組み化の提案

「ルール追加」「ワークフロー改善」「ツール設定」に分類された指摘について、具体的な仕組み化案を提案する。

`AskUserQuestion` で以下の形式で確認：

```
質問: "以下の仕組み化を行いますか？"

各指摘について選択肢を提示：
- CLAUDE.mdにルール追加
- 新規command作成
- 新規skill作成
- biome/設定で対応
- 仕組み化しない（今回のみ対応）
```

#### 4a. CLAUDE.mdへのルール追加

- 既存のセクション構成を維持し、適切なセクションにルールを追記する
- 既存ルールと重複・矛盾しないことを確認する
- 簡潔で具体的なルール記述にする（例：「〜は禁止です。代わりに〜を使用してください。」）

#### 4b. 新規command作成

- `.claude/commands/` に新しいmdファイルを作成
- 既存commandのフォーマット（YAML frontmatter + マークダウン）に従う
- 以下の構成で作成：
  - description（YAMLフロントマター）
  - 引数セクション（必要な場合）
  - タスクセクション（番号付きステップ）
  - 出力フォーマット（必要な場合）

#### 4c. 新規skill作成

- `.claude/skills/<skill-name>/SKILL.md` として作成
- 既存skillのフォーマットに従う（name, description フロントマター + ワークフロー）
- 複数ステップの自動化ワークフローに適している場合にskillを選択

#### 4d. ツール設定の変更

- `biome.json` のルール追加
- その他の設定ファイル変更
- 変更内容を明示してから適用する

### 5. 適用と確認

1. ユーザーが承認した仕組み化を順番に適用する
2. 適用結果をサマリとして出力する：

```markdown
## 仕組み化サマリ

### コード修正
- [x] <修正内容1>
- [x] <修正内容2>

### 仕組み化した項目
| 指摘 | 対応 | 追加先 |
|------|------|--------|
| <指摘内容> | <ルール/command/skill> | <ファイルパス> |

### 仕組み化しなかった項目
- <理由付きで記載>
```

### 6. 検証

以下を実行して問題がないことを確認：

```bash
pnpm lint
pnpm typecheck
```

### 7. コミットとPR作成（必須）

仕組み化の変更を必ずPRとして提出する。CLAUDE.mdのworktreeルールに従うこと。

#### 7a. worktree作成とファイルコピー

```bash
# メインリポジトリのルートで実行
git worktree add ../mirai-gikai-<branch-name> -b <branch-name>
mkdir -p ../mirai-gikai-<branch-name>/.claude
cp .claude/settings.local.json ../mirai-gikai-<branch-name>/.claude/
cp .env ../mirai-gikai-<branch-name>/
```

- ブランチ名は `chore/codify-<変更内容の要約>` とする（例: `chore/codify-add-pr-step`）
- 変更対象のファイルをworktreeにコピーする

#### 7b. コミットとpush

```bash
cd ../mirai-gikai-<branch-name>
git add <変更ファイル>
git commit -m "<コミットメッセージ>"
git push -u origin <branch-name>
```

#### 7c. PR作成

```bash
gh pr create --title "<タイトル>" --body "<本文>"
```

- PR本文には「仕組み化サマリ」（ステップ5の出力）を含める
- PR作成前に `gh pr list --state open` で既存PRとの重複を確認する

#### 7d. worktreeクリーンアップ

```bash
git worktree remove ../mirai-gikai-<branch-name>
```
