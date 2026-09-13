---
allowed-tools: Bash(git:*), Bash(gh:*), Bash(pnpm:*), Bash(rg:*)
description: Linear の Todo チケットを1つ選び、実装→ローカル検証→PR作成までを1ループ実行する
---

# ループエンジニアリング: 1イテレーション

あなたはループエンジニアリングの1イテレーションを実行するエージェントです。
運用ルールの全体像は [docs/loop-engineering.md](../../docs/loop-engineering.md) を参照してください。

## 現在の状況

- 作業ディレクトリ: !`pwd`
- 現在のブランチ: !`git branch --show-current`
- 変更状態: !`git status --short`
- develop の最新CI: !`gh run list --branch develop --workflow code_check.yml --limit 1 --json conclusion,displayTitle --jq '.[] | "\(.conclusion // "実行中") \(.displayTitle)"'`
- オープン中の loop PR: !`gh pr list --state open --limit 50 --json number,title,headRefName,mergeStateStatus --jq '.[] | select(.headRefName | startswith("loop/")) | "#\(.number) \(.title) [\(.mergeStateStatus)]"'`

## 絶対ルール

1. **1ループ = 1チケット = 1PR**。選んだチケットのスコープだけを実装する。
2. **マージしない。** PR を作成したらそこで終わる。`gh pr merge` は実行しない。マージは人間が行う。
3. **着手対象は Linear の GIKAI チームで status が `Todo` かつ assignee が自分のものだけ。** 他人のチケットには触らない。
4. **スコープアウトの原則**: 作業中に「これもやらなきゃ」と気づいたことは、**実装せず** Linear にチケットを起票する。
   - AIが自律実装できる粒度なら `Todo` + 自分に assign
   - ループ機構そのものを妨げるブロッカーなら `Todo` + 優先度 Urgent
   - 人間の判断が必要なら `Human Spec Review`
   - 本文には「なぜ必要か」「完了条件」「気づいた経緯」を書く
5. **最後に必ず結果行を出力する**（後述の LOOP_RESULT 形式）。これをループランナーが解析する。
6. ユーザーへの質問はできない前提で動く（無人実行）。判断に迷ったらエスカレーションする。
7. **`scripts/loop-once.sh` と `scripts/loop.sh` には一切触れない**（編集・restore・checkout での復元を含む）。
   実行中のランナー自身であり、書き換えると壊れる。変更が必要だと気づいたらチケットとして起票する。
8. **マイグレーション（`supabase/migrations/`）を伴う変更には着手しない。** `Human Spec Review` に送る。

## 手順

### 1. 前提確認

- 作業ツリーが汚れている場合（`git status --porcelain` が空でない場合）は、何もせず
  `LOOP_RESULT: FAILED reason=dirty-tree` を出力して終了する。
- `git checkout develop && git pull origin develop` で最新の develop に立つ。
- `pnpm-lock.yaml` が前回から変わっていれば `pnpm install --frozen-lockfile` を実行する。

### 2. 渋滞チェック（backpressure）

マージは人間が行うため、レビュー待ちの PR が溜まりうる。
「現在の状況」の **オープン中の loop PR が3件以上あれば**、新規着手せず
`LOOP_RESULT: NO_TASK reason=pr-queue-full` を出力して終了する。
ただし後述の修理対象がある場合は修理を優先する（修理は新しい PR を増やさないため）。

### 3. CI健全性チェック（修理モード）

新しいチケットに着手する前に、既存の成果物が健全かを確認する。
**問題があればこのループは新規タスクではなく修理に充てる**（1ループ=1修理。修理したら新規には進まない）。

以下を上から順に確認し、最初に見つかった1件だけを修理する。

1. **develop の CI が落ちている場合**:
   - `gh run view --log-failed` で原因を特定し、`loop/fix-develop-ci-<slug>` ブランチで修正する
   - 対応する Linear チケットが無ければ起票してから着手し、以降は通常の手順（検証→PR）に合流する
2. **オープン中の loop PR にチェック失敗またはコンフリクトがある場合**:
   - `gh pr checks <N>` で状態を確認する。**pending（実行中）のPRは健全なので対象外。
     チェックが全て成功していて人間のマージ待ちなだけのPRも対象外**
   - failure のPR、または mergeStateStatus が DIRTY（コンフリクト）のPRのうち、番号最小の1件を修理する
   - `gh pr checkout <N>` でブランチに乗り、失敗ログを確認して修正 → ローカル検証（手順6）→ push
   - コンフリクトは `git merge origin/develop` で解消する
   - 修正の試行は3回まで。通らなければ、PRに紐づく Linear チケットを `Blocked` にして状況をコメントし、
     `LOOP_RESULT: BLOCKED issue=<ID> reason=...` で終了する
   - 修理が完了したら `LOOP_RESULT: SUCCESS issue=<ID> pr=<PR URL>` で終了する

どちらも問題なければ次のステップへ。

### 4. チケット選択とクレーム

- Linear MCP で GIKAI チームの issue を取得する。`mcp__linear__*` が使えなければ
  `mcp__claude_ai_Linear__*` にフォールバックする。
- 条件は **status が `Todo`** かつ **assignee が自分**。以下の優先順位で1つ選ぶ。
  1. **優先度が Urgent のものを最優先**。複数あれば識別子の番号が最小のもの
  2. 無ければ優先度の高い順、同率なら番号が最小のもの
- 対象がなければ `LOOP_RESULT: NO_TASK` を出力して終了する。
- 選んだら直ちにステータスを `In Progress` に変えてクレームする（二重着手防止）。
  あわせて「🤖 ループ着手します」とコメントする。
- チケット本文とコメントを読み、完了条件を把握する。完了条件が読み取れないほど曖昧な場合は
  実装せず `Human Spec Review` に付け替え、何が曖昧かをコメントしてエスカレーションする。

### 5. ブランチ作成

- `git checkout -b loop/gikai-<番号>-<短いslug>`（例: `loop/gikai-414-admin-topic-analysis-link`）

### 6. 実装

- `AGENTS.md`（= `CLAUDE.md`）の規約に従う。特に以下。
  - 内部リンクは `@/lib/routes` の関数を使う。文字列リテラルでのルート直書きは禁止
  - 新しいページを追加したら `routes.ts` にもルート関数を追加する
  - インラインSVG禁止。アイコンは `lucide-react` から import する
  - `<button>` 禁止。`@/components/ui/button` の `Button` を使う
  - インラインカラーコード禁止。`globals.css` の `@theme inline` のトークンを使う
  - 純粋関数は `utils/` に切り出し、同階層に `*.test.ts` を書く
  - web と admin で同じロジックを使うなら `packages/` に切り出す
- テストを書く。
- **スコープアウトの原則を徹底する**。PRが大きくなりそうだと感じたら、それはスコープを切り出すシグナル。

### 7. セルフレビュー

`/simplify` を実行して重複・可読性・効率の観点で自己修正する。
続けて `/review` を実行する。**`/review` が環境要因で失敗した場合は中断せず、その旨を PR 本文に記録して続行する。**

### 8. ローカル検証

```bash
pnpm verify
```

`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm test` を順に実行する。
失敗したら修正して再実行。**修正の試行は3回まで**。3回試しても通らなければエスカレーションする。

統合テストは実行しない。CI が拾う。

### 9. コミット・PR作成

- 変更をコミットする。**コミットメッセージは英語**。既存履歴の慣習に合わせる。
  conventional commits のプレフィックスは付けない。
- `git push -u origin <branch>`
- `gh pr create` でPRを作成する。**PRタイトルと本文は日本語**。`feat:` 等のプレフィックスは付けない。
  本文に必ず含めること。
  - 目的
  - 変更内容の要約
  - `pnpm verify` の実行結果
  - スコープアウトして起票したチケットの一覧（あれば）
  - `/review` が失敗した場合はその旨
  - **UI変更を含む場合**（`web/src` / `admin/src` の `.tsx` `.css` を触った場合）は
    「スクリーンショット未添付。`/pr-screenshot` の実行が必要」と明記する
  - **PR本文に工程や経緯を書かない。** セルフレビューを実施した旨などは書かない
  - **Claude の attribution を一切入れない。** Co-Authored-By・Generated with・セッションURL すべて禁止
- **`gh pr merge` は実行しない。**
- Linear チケットを `In Review` に変更し、PR の URL をリンクとして添付する。
  あわせて「🤖 PR作成: <URL>」とコメントする。

### 10. 結果出力

ループの最後に、**必ず1行**、以下の形式で出力する。

- 成功: `LOOP_RESULT: SUCCESS issue=<ID> pr=<PR URL>`
- タスクなし: `LOOP_RESULT: NO_TASK` （渋滞時は `LOOP_RESULT: NO_TASK reason=pr-queue-full`）
- エスカレーション: `LOOP_RESULT: BLOCKED issue=<ID> reason=<短い理由>`
- その他失敗: `LOOP_RESULT: FAILED reason=<短い理由>`

## エスカレーション

続行不能になったら（検証3回失敗、仕様の曖昧さ、権限不足、環境問題など）。

1. Linear チケットに状況を詳細にコメントする（何を試し、何で詰まったか。次の人・次のループが再開できる情報を残す）
2. ステータスを変える。
   - 技術的ブロッカー（依存・環境・外部要因）→ `Blocked`
   - 仕様の曖昧さ・人間の判断が必要 → `Human Spec Review`
3. 中途半端な変更はコミットせず `git checkout develop` に戻る
   （作業内容を残したい場合はWIPコミットをプッシュしてドラフトPRにし、チケットからリンクする）
4. `LOOP_RESULT: BLOCKED issue=<ID> reason=...` を出力して終了する
