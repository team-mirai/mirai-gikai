#!/usr/bin/env bash
#
# ループエンジニアリング: 1回だけループを実行する
#
# 毎回まっさらな Claude Code セッション（claude -p）で /loop-once を実行する。
# 手順の実体は .claude/commands/loop-once.md にある。
#
# 使い方:
#   ./scripts/loop-once.sh
#
# 環境変数:
#   LOOP_WORKTREE  ループの作業ディレクトリ（既定: リポジトリの隣の mirai-gikai-loop）
#   LOOP_LOG_FILE  ログの出力先（未指定なら .loop/logs/single-<時刻>.log）
#
# 終了コード:
#   0 = SUCCESS（PR作成まで完了）
#   1 = FAILED（環境起因などの失敗）
#   2 = NO_TASK（着手可能なチケットが無い、または PR が渋滞している）
#   3 = BLOCKED（チケット側にエスカレーション済み。次のタスクには進める）

set -uo pipefail

# 本体を main() に包み、bash に実行前へ全体をパースさせる。
# 実行中にこのファイル自体が書き換わっても、読み込み済みの定義で最後まで走る。
main() {
  local repo_root
  repo_root="$(cd "$(dirname "$0")/.." && pwd)"

  local worktree="${LOOP_WORKTREE:-$(dirname "$repo_root")/mirai-gikai-loop}"

  if [[ ! -d "$worktree" ]]; then
    echo "[loop-once] 作業用 worktree が見つかりません: $worktree" >&2
    echo "[loop-once] docs/loop-engineering.md の「事前準備」を実施してください。" >&2
    exit 1
  fi

  cd "$worktree" || exit 1

  # --- 前処理: Node のバージョン確認 ---
  # 20.19 未満だと vitest の jsdom 依存が ERR_REQUIRE_ESM で落ち、pnpm verify が必ず失敗する。
  # エージェントに3回リトライさせても直らないので、ここで落とす。
  local node_major node_minor
  node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  node_minor="$(node -p 'process.versions.node.split(".")[1]' 2>/dev/null || echo 0)"
  if (( node_major < 20 || (node_major == 20 && node_minor < 19) )); then
    echo "[loop-once] Node $(node -v) では pnpm test が ERR_REQUIRE_ESM で落ちます。" >&2
    echo "[loop-once] 20.19 以上を使ってください（例: nvm use 20.19.5）。" >&2
    exit 1
  fi

  # --- 前処理: 作業ツリーの状態確認 ---
  if [[ -n "$(git status --porcelain)" ]]; then
    local branch
    branch="$(git branch --show-current)"
    if [[ "$branch" == loop/* ]]; then
      # 前のループが中断して残した作業。退避して develop に戻る
      echo "[loop-once] 前ループの残骸を退避します: $branch"
      git stash push -u -m "loop-abandoned:$branch:$(date +%Y%m%d-%H%M%S)"
      git checkout develop
    else
      echo "[loop-once] 作業ツリーが汚れています (branch: $branch)。中断します。" >&2
      exit 1
    fi
  fi

  local log_file="${LOOP_LOG_FILE:-$worktree/.loop/logs/single-$(date +%Y%m%d-%H%M%S).log}"
  mkdir -p "$(dirname "$log_file")"

  echo "[loop-once] 開始 (worktree: $worktree) → $log_file"

  # stream-json を jq で進捗行に整形して流す。そのままだと完了まで無出力で不安になる。
  # 整形後のテキストをログに残すので、LOOP_RESULT の grep は従来どおり効く。
  local jq_progress='
    def ts: now | strflocaltime("%H:%M:%S");
    def summary:
      (.command // .file_path // .description // .prompt // .pattern // tojson)
      | tostring | gsub("\\s+"; " ") | .[0:150];
    (try fromjson catch null) as $e
    | if $e == null then .
      elif $e.type == "assistant" then
        ($e.message.content // [])
        | map(
            if .type == "text" then "[\(ts)] \(.text | gsub("\\s+"; " ") | .[0:300])"
            elif .type == "tool_use" then "[\(ts)] → \(.name): \(.input | summary)"
            else empty end
          )
        | .[]
      elif $e.type == "result" then "[\(ts)] == result: \($e.subtype // "ok")"
      else empty end'

  claude -p "/loop-once" \
    --dangerously-skip-permissions \
    --output-format stream-json --verbose \
    2>&1 \
    | jq -r --unbuffered "$jq_progress" 2>/dev/null \
    | tee "$log_file"

  # --- 結果行の解析 ---
  local result
  result="$(grep -Eo 'LOOP_RESULT: [A-Z_]+[^\r]*' "$log_file" 2>/dev/null | tail -1 || true)"

  if [[ -z "$result" ]]; then
    echo "[loop-once] LOOP_RESULT が出力されませんでした。FAILED として扱います。" >&2
    exit 1
  fi

  echo ""
  echo "[loop-once] $result"

  case "$result" in
    *"LOOP_RESULT: SUCCESS"*) exit 0 ;;
    *"LOOP_RESULT: NO_TASK"*) exit 2 ;;
    *"LOOP_RESULT: BLOCKED"*) exit 3 ;;
    *) exit 1 ;;
  esac
}

main "$@"
