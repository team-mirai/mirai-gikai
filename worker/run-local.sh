#!/usr/bin/env bash
#
# ローカル Supabase に対して worker を起動する開発用ランチャ。
# Cloud Run Job の挙動を手元で安全に再現する（接続先=ローカルなので staging/prod は触らない）。
#
# 使い方:
#   npx supabase start            # 事前にローカル Supabase を起動
#   bash worker/run-local.sh --mode=backfill
#   bash worker/run-local.sh --mode=analyze --bill-id=<uuid> --version-id=<uuid>
#
# 接続情報:
#   - SUPABASE_URL / SUPABASE_SECRET_KEY … `supabase status` から自動取得（ローカル）
#   - AI_GATEWAY_API_KEY … ルート .env から読み込む（実 LLM 呼び出し＝コストが出る点に注意）
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ローカル Supabase の接続情報を取得（API_URL / SECRET_KEY）
STATUS="$(npx supabase status -o env 2>/dev/null || true)"
SUPABASE_URL="$(printf '%s\n' "$STATUS" | sed -nE 's/^API_URL="?([^"]+)"?$/\1/p')"
SUPABASE_SECRET_KEY="$(printf '%s\n' "$STATUS" | sed -nE 's/^SECRET_KEY="?([^"]+)"?$/\1/p')"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SECRET_KEY" ]]; then
  echo "ERROR: ローカル Supabase が見つかりません。先に 'npx supabase start' を実行してください。" >&2
  exit 1
fi
export SUPABASE_URL SUPABASE_SECRET_KEY

echo "▶ worker (local) を起動: SUPABASE_URL=${SUPABASE_URL}  args: $*"
echo "  ※ 接続先はローカル。AI_GATEWAY_API_KEY は .env から（実 LLM 呼び出しが走ります）"

# AI_GATEWAY_API_KEY 等は .env から注入（dotenv-cli は既存の export を上書きしないので
# 上で export した SUPABASE_* がそのまま優先される）。worker の start で実行する。
exec pnpm exec dotenv -e "${REPO_ROOT}/.env" -- \
  pnpm --filter @mirai-gikai/topic-analysis-worker start -- "$@"
