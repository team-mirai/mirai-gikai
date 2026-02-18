#!/bin/bash

# 例：リモート環境でのみ実行
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

pnpm install