#!/bin/bash
# Edit/Write の直後に、編集したファイルだけを Biome で整形・修正する。
# 出力はいったん変数に受けてから切り詰める。`pnpm ... | head` だと head が先に
# 抜けたあと pnpm が終了せず、hook がタイムアウトまで止まるため。

set -u

FILE=$(node -e '
let s = "";
process.stdin.on("data", (c) => (s += c));
process.stdin.on("end", () => {
  try {
    const i = JSON.parse(s).tool_input ?? {};
    process.stdout.write(i.file_path ?? i.notebook_path ?? "");
  } catch {}
});
')

case "$FILE" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
OUTPUT=$(
  pnpm exec biome format --write --no-errors-on-unmatched "$FILE" 2>&1 &&
    pnpm exec biome lint --write --no-errors-on-unmatched "$FILE" 2>&1
)
printf '%s\n' "$OUTPUT" | head -30
exit 0
