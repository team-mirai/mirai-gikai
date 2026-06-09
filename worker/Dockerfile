# トピック分析・意見再抽出バックフィルを実行する Cloud Run Job 用イメージ。
# pnpm workspace の .ts ソースをそのまま tsx で実行する（ビルド工程を持たない）。
FROM node:22-slim

# pnpm を有効化（packageManager フィールドのバージョンを使用）
RUN corepack enable

WORKDIR /app

# ワークスペース全体をコピー（.dockerignore で node_modules / .next 等を除外）。
# frozen-lockfile install には全ワークスペースの package.json が必要。
COPY . .

# worker とその依存（topic-analysis-core / shared / supabase）だけをインストール。
RUN pnpm install --frozen-lockfile --filter @mirai-gikai/topic-analysis-worker...

WORKDIR /app/worker

# shared 内の `import "server-only"` を空モジュールに解決させる（Next 非依存で実行するため）。
ENV NODE_OPTIONS=--conditions=react-server

# Cloud Run Job の --args が ENTRYPOINT の後ろに追加される
#   例: --mode=analyze --bill-id=<uuid> --version-id=<uuid>
ENTRYPOINT ["pnpm", "exec", "tsx", "src/main.ts"]
