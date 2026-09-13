#!/usr/bin/env bash
#
# ループエンジニアリング: N回ループランナー
#
# for文で scripts/loop-once.sh を繰り返し呼び、停止条件を管理する。
#
# 使い方:
#   ./scripts/loop.sh 5     # 最大5回ループ
#
# 停止条件:
#   - 着手可能なチケットが無くなった、または loop PR が渋滞している (NO_TASK)
#   - 連続 MAX_CONSECUTIVE_FAILURES 回失敗した
#   - 指定回数に達した
#
# 環境変数:
#   LOOP_WORKTREE  ループの作業ディレクトリ（既定: リポジトリの隣の mirai-gikai-loop）
#
# ログ: <worktree>/.loop/logs/<開始時刻>/loop-<i>.log

set -uo pipefail

main() {
  local script_dir repo_root
  script_dir="$(cd "$(dirname "$0")" && pwd)"
  repo_root="$(cd "$script_dir/.." && pwd)"

  local worktree="${LOOP_WORKTREE:-$(dirname "$repo_root")/mirai-gikai-loop}"

  local count="${1:-1}"
  if ! [[ "$count" =~ ^[1-9][0-9]*$ ]]; then
    echo "usage: $0 [回数(正の整数)]" >&2
    exit 1
  fi

  if [[ ! -d "$worktree" ]]; then
    echo "[loop] 作業用 worktree が見つかりません: $worktree" >&2
    echo "[loop] docs/loop-engineering.md の「事前準備」を実施してください。" >&2
    exit 1
  fi

  local max_consecutive_failures=2
  local run_id log_dir
  run_id="$(date +%Y%m%d-%H%M%S)"
  log_dir="$worktree/.loop/logs/$run_id"
  mkdir -p "$log_dir"

  echo "== loop run $run_id: 最大 $count 回 (worktree: $worktree, ログ: $log_dir) =="

  local consecutive_failures=0
  local results=()
  local i status result log_file

  for ((i = 1; i <= count; i++)); do
    log_file="$log_dir/loop-$i.log"
    echo ""
    echo "[loop $i/$count] 開始"

    LOOP_LOG_FILE="$log_file" "$script_dir/loop-once.sh"
    status=$?

    result="$(grep -Eo 'LOOP_RESULT: [A-Z_]+[^\r]*' "$log_file" 2>/dev/null | tail -1 || true)"
    results+=("[loop $i] exit=$status ${result:-LOOP_RESULT: (なし)}")

    case "$status" in
      0) # SUCCESS
        consecutive_failures=0
        ;;
      2) # NO_TASK
        echo "[loop $i/$count] 着手可能なチケットがありません。終了します。"
        break
        ;;
      *) # FAILED(1) / BLOCKED(3)
        # BLOCKED はチケット側にエスカレーション済みなので次に進んでよいが、
        # 環境起因の失敗が続く場合は無駄な消費を防ぐため停止する
        consecutive_failures=$((consecutive_failures + 1))
        if ((consecutive_failures >= max_consecutive_failures)); then
          echo "連続 $consecutive_failures 回失敗したため中断します。" >&2
          break
        fi
        ;;
    esac
  done

  # --- 後処理: 次の作業をしやすいように develop へ戻す ---
  local current_branch
  current_branch="$(git -C "$worktree" branch --show-current)"
  if [[ "$current_branch" != "develop" ]]; then
    if [[ -n "$(git -C "$worktree" status --porcelain)" ]]; then
      echo ""
      echo "[loop] 作業ツリーが汚れているため退避します (branch: $current_branch)"
      git -C "$worktree" stash push -u -m "loop-abandoned:$current_branch:$(date +%Y%m%d-%H%M%S)"
    fi
    echo ""
    if git -C "$worktree" checkout develop; then
      echo "[loop] develop に戻りました (元: $current_branch)"
    else
      echo "[loop] develop に戻れませんでした。$current_branch のままです。" >&2
    fi
  fi

  echo ""
  echo "== loop run $run_id サマリ =="
  printf '%s\n' "${results[@]}"
  echo ""
  echo "確認すること:"
  echo "  gh pr list --state open --search 'head:loop/'   # レビュー待ちの loop PR"
  echo "  Linear の In Review          → PR をレビューしてマージ"
  echo "  Linear の Blocked            → ブロッカーを解消して Todo に戻す"
  echo "  Linear の Human Spec Review  → 判断して本文を更新し Todo に戻す"
  echo "  Linear の In Progress の残留 → 異常終了の痕跡。Todo に戻す"
  echo "  git -C $worktree stash list | grep loop-abandoned"
}

main "$@"
