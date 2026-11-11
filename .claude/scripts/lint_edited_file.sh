#!/bin/bash
# Edit/Write の直後に、編集したファイルだけを Biome で整形・修正する。

set -u

FILE=$(node -e 'try { process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).tool_input?.file_path ?? "") } catch {}')

case "$FILE" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

BIOME="$CLAUDE_PROJECT_DIR/node_modules/.bin/biome"
[ -x "$BIOME" ] || exit 0

"$BIOME" format --write --no-errors-on-unmatched "$FILE" >/dev/null 2>&1 &&
  "$BIOME" lint --write --no-errors-on-unmatched "$FILE" >/dev/null 2>&1
exit 0
