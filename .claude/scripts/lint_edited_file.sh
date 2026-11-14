#!/bin/bash
# Edit/Write の直後に、編集したファイルだけを Biome で整形・修正する。
# worktree で編集したファイルは、その worktree の biome.json と node_modules で処理する。

set -u

[ -n "${CLAUDE_PROJECT_DIR:-}" ] || exit 0

FILE=$(node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.file_path ?? "") } catch {}')
[ -f "$FILE" ] || exit 0

ROOT=$(git -C "$(dirname "$FILE")" rev-parse --show-toplevel 2>/dev/null) || exit 0
[ "$(git -C "$ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" = \
  "$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" ] || exit 0

BIOME="$ROOT/node_modules/.bin/biome"
[ -x "$BIOME" ] || exit 0

cd "$ROOT" || exit 0
"$BIOME" format --write --no-errors-on-unmatched "$FILE" >/dev/null 2>&1 &&
  "$BIOME" lint --write --no-errors-on-unmatched "$FILE" >/dev/null 2>&1
exit 0
