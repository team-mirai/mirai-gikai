#!/bin/bash
# PRに無関係なコミットが混入するのを防ぐため、
# git push 前にブランチのコミットが他ブランチ由来でないか検証する。
#
# 検出ロジック: origin/develop..HEAD のコミットが、自ブランチ・develop 以外の
# リモートブランチにも存在する場合、別ブランチから分岐した可能性がある。

set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || true)

# develop/main ブランチ自体への push は検証不要
if [ "$BRANCH" = "develop" ] || [ "$BRANCH" = "main" ]; then
  exit 0
fi

# origin/develop を参照
BASE_REF="origin/develop"
if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  exit 0
fi

# origin/develop に無い（= このブランチ独自の）コミット一覧
COMMITS=$(git rev-list "$BASE_REF"..HEAD 2>/dev/null || true)
if [ -z "$COMMITS" ]; then
  exit 0
fi

FOREIGN_FOUND=0
FOREIGN_DETAILS=""

for COMMIT in $COMMITS; do
  # このコミットを含むリモートブランチ（自ブランチと develop を除外）
  OTHER_BRANCHES=$(git branch -r --contains "$COMMIT" 2>/dev/null \
    | grep -v "origin/$BRANCH" \
    | grep -v "origin/develop" \
    | grep -v "HEAD" \
    | sed 's/^[[:space:]]*//' \
    || true)

  if [ -n "$OTHER_BRANCHES" ]; then
    FOREIGN_FOUND=1
    SHORT=$(git log --oneline -1 "$COMMIT")
    FOREIGN_DETAILS="${FOREIGN_DETAILS}  ${SHORT}  ← ${OTHER_BRANCHES}\n"
  fi
done

if [ "$FOREIGN_FOUND" -eq 1 ]; then
  echo "BLOCKED: ブランチ '$BRANCH' に他ブランチ由来のコミットが含まれています。"
  echo ""
  echo "該当コミット:"
  echo -e "$FOREIGN_DETAILS"
  echo "PRに無関係な変更が混入する可能性があります。"
  echo "対処法: git rebase --onto develop <分岐元コミット> $BRANCH"
  exit 2
fi
