# Repository Guidelines

## 必須ルール

### Worktree必須
変更作業は、**必ず git worktree を作成してから開始すること**。メインのリポジトリディレクトリでは直接変更を行わない。

```bash
# 1. worktreeを作成
git worktree add ../mirai-gikai-<branch-name> -b <branch-name>

# 2. settings.local.jsonをコピー（権限設定のため必須）
mkdir -p ../mirai-gikai-<branch-name>/.claude
cp .claude/settings.local.json ../mirai-gikai-<branch-name>/.claude/

# 3. .envをコピー（環境変数の引き継ぎ）
cp .env ../mirai-gikai-<branch-name>/

# 4. 依存パッケージをインストール
cd ../mirai-gikai-<branch-name> && pnpm install --frozen-lockfile
```

- **目的**: developブランチを常にクリーンに保ち、作業の分離と並列作業を容易にする

### 実装完了後は即PR作成
実装完了後は「コミットしますか？」等の確認を挟まず、コミット → push → PR作成まで一気に進めること。ユーザーへの確認は不要。

### Codexレビュー必須
実装完了後（コミット前）に、必ず `/review-codex` スキルを実行してCodex CLIによるコードレビューを受けること。指摘があれば修正してからコミットする。
Codexレビューを通過したら、ユーザーに確認せずそのままPR作成まで一気に進めること（push → `gh pr create`）。

### 並列PR作成
複数の独立したPRを作成する場合は `/parallel-pr` スキルを使用すること。

## Project Structure & Module Organization
- `web/` は公開用 Next.js アプリ。共通 UI は `src/components`、Vitest のテストは `src/**/*.test.ts` に配置します。
- `admin/` はポート 3001 で動く管理用 Next.js。審議フローやダッシュボードはここに集約します。
- `packages/supabase/` は共有 Supabase クライアントと型定義を提供し、生成結果は `types/` に保存します。
- `packages/seed/` はローカルデータ投入用の TypeScript スクリプト (`run.ts`, `data.ts`) を管理します。
- `supabase/` はマイグレーションと設定ファイルを保持します。
- 設計ドキュメントは `docs/` に格納し、ルートの設定ファイル（`biome.json`, `pnpm-workspace.yaml` など）は全体ポリシーとして扱います。

## Next.js アーキテクチャ指針
- Bulletproof React の feature ベース構成を採用します。
- `app/` 配下の `page.tsx` は、URL パラメータ（`params` や `searchParams`）の取得と Feature コンポーネントへの受け渡しのみを担当する薄いラッパーとし、ビューやロジックは `features/` 配下に実装します。
- export 用の `index.ts` は作成せず、必要なファイルから直接 import します。
- Server Components を標準とし、状態管理・イベント処理が必要な場合のみ `"use client"` を付与した Client Component を追加します。
- ファイル名はケバブケース、コンポーネントはパスカルケース、関数はキャメルケースで統一します。

### Feature ディレクトリ構造
複雑な feature では server/client/shared の3層構造を採用します：

```
src/features/{feature}/
├── server/
│   ├── repositories/  # データアクセス層（Supabase呼び出しを集約）
│   ├── components/    # Server Components
│   ├── loaders/       # Server Components用データ取得関数
│   ├── actions/       # Server Actions ("use server")
│   ├── services/      # ビジネスロジック層
│   └── utils/         # Server専用ユーティリティ
├── client/
│   ├── components/    # Client Components（Server/Client両方で使えるものも含む）
│   ├── hooks/         # カスタムフック
│   └── utils/         # Client専用ユーティリティ
└── shared/
    ├── types/         # 共通型定義
    └── utils/         # 共通ユーティリティ
```

`web/` と `admin/` の両方で同じ server/client/shared 構成を採用します。ただし `admin/` では Server Components が中心のため `client/` ディレクトリを省略している feature もあります。

- Server側ファイルには `"server-only"` を、Client Componentsには `"use client"` を付与
- 型定義やServer/Client両方で使う関数は `shared/` に配置
- **純粋関数の切り出し**: 新規実装時、外部依存（DB・API・認証等）を持たない計算・変換・判定ロジックは純粋関数として `utils/` に切り出すこと。配置先は用途に応じて `shared/utils/`、`server/utils/`、`client/utils/` を選択する。
- シンプルな feature は従来の `components|actions|api|types` 構成でも可

Repository レイヤーの詳細は [docs/repository-layer.md](docs/repository-layer.md) を参照。

## Build, Test, and Development Commands
- 依存導入は `pnpm install`、全てのスクリプトは pnpm 経由で実行します。
- `pnpm dev` は `.env` を共有しつつ `web`・`admin`・各パッケージの dev サーバーを並列起動します。
- `pnpm test` でワークスペース横断の Vitest を実行。局所実行は `pnpm --filter web test` や `test:watch` を利用します。
- 品質ゲートとして `pnpm lint`（Biome format+lint）と `pnpm typecheck` を PR 前に通過させます。
- DB 関連は `pnpm db:reset`、`pnpm db:migrate`、`pnpm db:types:gen`、`pnpm seed` を用途に応じて組み合わせます。

## Coding Style & Naming Conventions
- Biome が 2 スペースインデント、LF、ダブルクォート、セミコロン、80 文字幅を強制します。
- React コンポーネントと公開型は PascalCase、フックやユーティリティは camelCase を維持します。
- ファイル名は `bill-contents-data.ts` のようにローワーハイフンで表記し、スタイルは Tailwind ユーティリティを先に検討します。
- **アイコン**: インラインSVGは禁止です。必ず `lucide-react` からアイコンコンポーネントをインポートして使用してください。
- **ボタン**: `<button>` タグの使用は禁止です。必ず `@/components/ui/button` の `Button` コンポーネントを使用してください。
- **色**: インラインカラーコード（`text-[#xxx]`, `bg-[#xxx]`, `border-[#xxx]` 等の arbitrary value や style 属性での直接指定）は**禁止**です。必ず `globals.css` の `@theme inline` で定義済みのカラートークン（`text-mirai-text`, `bg-primary`, `border-primary-accent` 等）を使用してください。新しい色が必要な場合は、まず `globals.css` にトークンを追加してから使用すること。既存トークン一覧は `web/src/app/globals.css` の `@theme inline` ブロックを参照。

## Testing Guidelines
- Vitest の単体テストを `*.test.ts` として実装と同階層に配置し、AI コスト計算や Markdown 処理などデータ変換の変更時は必ず回帰テストを追加します。
- **純粋関数にはテスト必須**: `utils/` に切り出した純粋関数は、新規作成時に必ず `*.test.ts` を同階層に作成してテストを書いてください。
- **mock は極力使わない**: `vi.mock("server-only")` 等のモックに頼らず、テスト対象のロジックを純粋関数として `shared/` に切り出してからテストしてください。`server-only` や外部依存を含むファイルからは re-export で参照を維持します。
- **ローカルサービスは real で動かす**: Supabase などローカルで起動できるサービスはモックせず、実際のローカルインスタンスに接続してテストします。
- **外部 API は DI でモックする**: OpenAI などの外部 API クライアントはインターフェースを定義し、テストでは Fake/Mock 実装に差し替えます。
- PR 前に `pnpm --filter web test:watch` で失敗を早期検知し、必要に応じて `vitest run --coverage` でカバレッジ低下を確認します。
- テストの書き方・構造化・コード例などの詳細は [docs/テストガイドライン.md](docs/20260219_1000_テストガイドライン.md) を参照。

## Commit & Pull Request Guidelines
- **push前のローカル検証（必須）**: `git push` の前に、CIと同じ検証コマンドをローカルで実行して通過を確認すること。CIで落ちてから直すのではなく、手元で事前に検知する。
  ```bash
  pnpm lint        # Biome format + lint チェック
  pnpm typecheck   # TypeScript 型チェック
  pnpm test        # 全ワークスペースのテスト実行
  ```
- **push / PR作成前のGitHub状態確認（必須）**: `git push` やPR作成を行う前に、必ず `gh pr list` や `gh pr view <番号>` でGitHub上のPR状態（open/merged/closed）を確認すること。マージ済みブランチへの追加pushや、既にクローズされたPRとの重複を防ぐ。
- コミットメッセージは既存履歴同様、短い命令形主体（日本語可）とし、課題連携は `(#id)` を付与します。
- PR ではスコープ概要、実行テスト記録（例: `pnpm dev`, `pnpm --filter web test`）、UI 変更時のスクリーンショットや GIF を添付します。
- スキーマ・シード・環境変数の変更は本文で明示し、レビューフィードバックへの対応状況を追跡コメントで共有して Ready for Review に切り替えます。
- **イシュー連携**: 特定のイシューに対応する PR を作成する場合、PR 本文に `Resolves #123` の形式で記載してください。これにより PR マージ時にイシューが自動クローズされます。複数のイシューを閉じる場合は `Resolves #123, Resolves #456` のように列挙します。
- **PR作成後の状態確認（必須）**: PR作成後、以下の4点を確認すること：
  1. **Conflict確認**: `gh pr view <番号> --json mergeable,mergeStateStatus` でマージ可能か確認。conflictがあれば解消してpushする。
  2. **CI確認**: `gh pr checks <番号>` でCIの状態を確認。失敗があれば原因を調査し修正してpushする。CIが実行中の場合は完了まで待つ。
  3. **CodeRabbitレビュー確認**: CodeRabbitのレビューが届くまで待ってからコメントを確認する。レビューは通常2〜3分で届く。`gh api repos/{owner}/{repo}/pulls/{number}/comments` でコメントを取得し、空なら少し待って再取得する。重要な指摘（Major/Critical）があれば修正してpushすること。軽微な指摘（Minor）や既存コードとの一貫性を優先すべきものはスキップ可。
  4. **対応済みコメントのresolve（必須）**: 修正をpushした後、対応済みのレビューコメントをGraphQL APIでresolveする。まず `gh api graphql` でスレッド一覧を取得し、`resolveReviewThread` mutationで対応済みスレッドをresolveする。
     ```bash
     # スレッド一覧取得（isResolved=falseのものが未resolve）
     gh api graphql -f query='{ repository(owner: "{owner}", name: "{repo}") { pullRequest(number: <番号>) { reviewThreads(first: 50) { nodes { id isResolved comments(first: 1) { nodes { body path } } } } } } }'
     # 対応済みスレッドをresolve
     gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<スレッドID>"}) { thread { isResolved } } }'
     ```

## Supabase & Environment Notes
- ローカル開発前に `npx supabase start` を実行し、`.env.example` を `.env` にコピーして値を整えます。
- スキーマ変更時は `supabase/migrations` のマイグレーションと `packages/supabase/types/supabase.types.ts` の再生成ファイルをセットでコミットします。
- `pnpm seed` は `admin@example.com / admin123456` を含む検証データを投入するため、開発用途に限定してください。
- **RLSとアクセスパターン**: マイグレーションでは必ず `alter table <テーブル名> enable row level security;` を記述してRLSを有効化すること。ただし **ポリシーは定義しない**（デフォルト全拒否）。データアクセスはすべて `createAdminClient()`（Service Role Key）経由で行い、認可ロジックはアプリケーション層（Server Actions / Loaders）で実装する。

## ドキュメント作成ルール
- 要件定義や実装計画をまとめる際は論点を先に洗い出し、不明点を確認してから Markdown で整理します。
- 設計文書は `docs/` 配下に `YYYYMMDD_HHMM_作業内容.md` で保存してください（例: `docs/20250815_1430_ユーザー認証システム設計.md`）。
- 既存資料に大きな変更を加える場合は新しいファイルとして残し、更新履歴をたどれるようにします。

## GitHub Issue作成ルール
GitHub Issueを作成する際は、以下のルールに従うこと：

- プラン内容を簡略化せず、そのままissueに記載する
- コード例、SQL、型定義などの詳細な実装内容を含める
- 検証方法を具体的に記載する
