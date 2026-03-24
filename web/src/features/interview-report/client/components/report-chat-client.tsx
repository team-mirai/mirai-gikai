"use client";

import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { BillWithContent } from "@/features/bills/shared/types";
import { ChatButton } from "@/features/chat/client/components/chat-button";

interface ReportChatClientProps {
  billContext: BillWithContent;
  hasInterviewConfig: boolean;
  difficultyLevel: DifficultyLevelEnum;
}

export function ReportChatClient({
  billContext,
  hasInterviewConfig,
  difficultyLevel,
}: ReportChatClientProps) {
  return (
    <ChatButton
      billContext={billContext}
      hasInterviewConfig={hasInterviewConfig}
      difficultyLevel={difficultyLevel}
      pageContext={{ type: "report" }}
      mobileBottomClass="bottom-20"
    />
  );
}
