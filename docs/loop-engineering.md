# ループエンジニアリング

AIエージェント（Claude Code）に実装を自律的に回してもらうための運用ルール。
人間が毎回指示を出すのではなく、**「指示を出すシステムそのもの」を設計する**手法で、
人間はループの設計・タスクの供給・レビュー・マージに回る。

社内では `video-processor` / `marumie` / `sns-analyzer` / `ai-interview` が同じ手法を採用している。
正本は [team-mirai/video-processor の docs/loop-engineering.md](https://github.com/team-mirai/video-processor/blob/main/docs/loop-engineering.md)。
このリポジトリは以下の2点を変えている。

| 項目 | 社内の正本 | このリポジトリ |
|---|---|---|
| タスクの源 | GitHub Issue の `loop:ready` ラベル | **Linear の GIKAI チーム** |
| ループの出口 | auto-merge で CI 通過後に自動マージ | **PR 作成で停止。マージは人間** |

変えた理由。タスク管理は Linear が正で、政調・広報も Linear を見ているため、GitHub Issue に写すと二重管理になる。
また公開リポジトリであり、develop はステージング環境に直結している。auto-merge はリポジトリ設定で無効のままにし、
人間のレビューを必ず挟む。

**ゴール収束型。** 着手可能なチケットが尽きるか、指定回数に達するか、失敗が続いたら停止する。回り続けることは目的にしない。

## 原則

**1ループ = 1チケット = 1PR = 1セッション。**
セッションを使い捨てることでコンテキスト膨張による品質劣化を防ぐ。
1ループは「チケット選択 → 実装 → ローカル検証 → PR作成」で完結し、そこで止まる。

**新規タスクより既存成果物の健全性が優先。**
develop の CI が落ちている、あるいは loop PR の CI が失敗しているなら、
そのループは新規チケットではなく修理に充てる。壊れた土台の上に積み上げない。

**詰まったら止まる。**
検証の試行回数には上限を設け、超えたらチケットのステータスを変えて人間にエスカレーションする。
エスカレーションしたチケットは `Todo` から外れるため、同じチケットを無限リトライすることはない。

**渋滞したら止まる。**
マージは人間が行うため、レビュー待ちの loop PR が溜まる。未マージの loop PR が上限に達したら新規着手しない。
人間がマージするまで待つ。

手順の実体は [.claude/commands/loop-once.md](../.claude/commands/loop-once.md)（この文書は手順を再掲しない）。

## スコープアウトの原則（このワークフローの核心）

作業中に「これもやらなきゃ」と気づいたことは、**その場で実装せずチケット化する**。

- AIが自律でできる → `Todo` かつ自分に assign → 後続のループが拾う
- 人間の判断が要る → `Human Spec Review` → 人間が判断してから `Todo` に戻す
- ループ全体を妨げるブロッカー → `Todo` + 優先度 Urgent → 後続のループが最優先で拾う

これにより1つのPRが肥大化せず、発見した課題がタスク管理上に必ず残り、
人間がやるべきことが `Human Spec Review` に集約される。

## Linear のステータス運用

| ステータス | 意味 | 誰が変えるか |
|---|---|---|
| `Todo` | ループの取り込み対象。assignee が自分のもののみ | 人間 / ループ（スコープアウト時） |
| `In Progress` | ループが着手中。二重着手の防止 | ループ |
| `In Review` | PR 作成済み。人間のレビューとマージ待ち | ループ |
| `Blocked` | 技術的ブロッカーで停止。依存・環境・外部要因 | ループ |
| `Human Spec Review` | 仕様が曖昧で実装できない。人間の判断が必要 | ループ |
| `QA` | PR マージ後に Linear 連携で自動遷移 | 自動 |

状態遷移は `Todo → In Progress → (In Review | Blocked | Human Spec Review)`。

`Blocked` / `Human Spec Review` を解消したら、人間が `Todo` に戻すことで再びループの対象になる。

**着手対象は「status が `Todo` かつ assignee が自分」に限る。** 他人のチケットには触らない。
優先度が Urgent のものを番号順より先に拾う。ループ機構そのものを妨げる問題を先に潰すと、以降の成功率が上がるため。

## チケットの書き方（タスクの供給）

要点は3つ。

1. **エンドユーザーに価値が生まれる縦切り単位**で、1PRで完結すること。
   web / admin / packages の層で分割しない。中間状態のチケットは単体で検証できない
2. **完了条件が検証可能な振る舞い**であること。「〜が表示される」「〜のテストが通る」。実現方法は書かない
3. **やらないことを明記**する。ループの暴走を防ぐ最大のガードレール

**How を書かない。** 実装手順・ファイルパス・関数名レベルの指示を本文に書かない。
ループは実際にコードを読むので、起票時点の推測より正確に判断できる。間違った How は正しい実装を妨げる。

## コマンド

```bash
./scripts/loop-once.sh    # 1回だけループを実行
./scripts/loop.sh 5       # 最大5回ループを実行
```

各イテレーションは `claude -p "/loop-once"` で**毎回新規セッション**を起動する。
対話セッション内で試したい場合は Claude Code 内で `/loop-once` を実行してもよい。
ログは `.loop/logs/` に残る（gitignore 済み）。

## 事前準備

ループは専用の worktree で動く。このリポジトリは worktree 必須・develop 起点という規約があるため、
**1イテレーションごとに worktree を作らず、専用 worktree を1つ用意してブランチだけ切り替える**。
毎回 `pnpm install` する時間を避けるための措置で、メインのチェックアウトを汚さないという規約の趣旨は満たす。

```bash
git worktree add ../mirai-gikai-loop -b loop-workspace origin/develop
mkdir -p ../mirai-gikai-loop/.claude
cp .claude/settings.local.json ../mirai-gikai-loop/.claude/
cp .env ../mirai-gikai-loop/            # 手動で実施すること
cd ../mirai-gikai-loop && pnpm install --frozen-lockfile
```

`.env` のコピーは必ず人間が行う。`pnpm build` が `dotenv -e .env` を要求するため、これが無いと検証が通らない。

環境変数 `LOOP_WORKTREE` でループの作業ディレクトリを指定する。未指定なら `../mirai-gikai-loop` を使う。

### Node のバージョン

**20.19 以上を使うこと。** 20.18 以下では vitest の jsdom 依存が `ERR_REQUIRE_ESM` で落ち、
`web` のテストが147ファイル中37ファイル失敗する。CI は `node-version: "20"` で最新の 20.x を引くため通るが、
手元のバージョンが古いと `pnpm verify` が必ず失敗し、ループは毎回エスカレーションして終わる。

`scripts/loop-once.sh` は起動時にバージョンを確認し、満たさない場合はセッションを起動せずに終了する。
エージェントに3回リトライさせても直らない種類の失敗なので、ループの外側で止めている。

```bash
nvm use 20.19.5
```

リポジトリに `.nvmrc` や `engines` の指定は無いため、各自で合わせる必要がある。

## 検証

ローカル検証は `pnpm verify` に集約した。中身は CI の `code_check.yml` と同じ4点。

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
```

統合テスト（`pnpm test:integration`）はローカルの Supabase 起動が必要なため、ループの検証には含めない。
CI の `integration_test.yml` が拾う。Supabase のマイグレーションや DB function を触るチケットは
`Human Spec Review` に送り、人間が対応する。

## 人間の役割

```bash
gh pr list --state open --search "head:loop/"   # レビュー待ちの loop PR
```

Linear で確認するもの。

- `In Review` のチケット → PR をレビューしてマージする
- `Blocked` のチケット → ブロッカーを解消して `Todo` に戻す
- `Human Spec Review` のチケット → 判断して本文を更新し `Todo` に戻す
- `In Progress` のまま残っていたら異常終了の痕跡。状況を確認して `Todo` に戻す

**マージするPRは必ず読むこと。** CI が通ったことは、意図どおりであることを保証しない。
コードを読まずに積み上げると理解の負債（Comprehension Debt）が溜まり、いずれ設計判断ができなくなる。

## 注意事項

- **`--dangerously-skip-permissions` で動く**ため、信頼できるチケットだけを `Todo` かつ自分 assign に置くこと
- **UI 変更を含む PR はスクリーンショットが未添付のまま出る。** `web/src` / `admin/src` の `.tsx` `.css` を触った場合、
  ループは PR 本文にその旨を書く。人間が `/pr-screenshot` を実行する
- **CodeRabbit の指摘対応はループの範囲外。** Minor 以上は人間が対応し、返信して resolve する
- **コンフリクト**: 連続するループが同じファイルを触ると発生する。関連の深いタスクは1つのチケットにまとめる。
  ループは着手時に develop を取り直すため、先行PRがマージ済みなら問題ない
- **コスト**: 1ループ = 1セッション分のトークンを消費する。回数指定は残チケット数に合わせる
- **マイグレーションを伴う変更はループに任せない。** 後方互換性とデータ移行の判断が要るため

## 参考資料

- [team-mirai/video-processor docs/loop-engineering.md](https://github.com/team-mirai/video-processor/blob/main/docs/loop-engineering.md) 社内の正本
- [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Addy Osmani: Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
