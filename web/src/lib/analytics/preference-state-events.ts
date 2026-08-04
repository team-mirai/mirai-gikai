"use client";

import { sendGAEvent } from "@next/third-parties/google";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";

/** 難易度表示の現在の設定を、ページ表示のたびにGAへ送る */
export function sendDifficultyStateEvent(level: DifficultyLevelEnum) {
  sendGAEvent("event", "difficulty_state", { level });
}

/** ふりがな表示の現在の設定を、ページ表示のたびにGAへ送る */
export function sendFuriganaStateEvent(enabled: boolean) {
  sendGAEvent("event", "furigana_state", { enabled });
}
