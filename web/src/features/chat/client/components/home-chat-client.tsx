"use client";

import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { ChatButton } from "./chat-button";

interface HomeChatClientProps {
  currentDifficulty: DifficultyLevelEnum;
  bills: Array<{
    name: string;
    summary?: string;
    tags?: string[];
    isFeatured?: boolean;
  }>;
}

/**
 * トップページ用のチャット機能を提供するコンポーネント
 */
export function HomeChatClient({
  currentDifficulty,
  bills,
}: HomeChatClientProps) {
  return (
    <ChatButton
      difficultyLevel={currentDifficulty}
      pageContext={{
        type: "home",
        bills,
      }}
    />
  );
}
