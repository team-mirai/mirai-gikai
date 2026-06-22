"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { archiveInterviewSession } from "../../server/actions/archive-interview-session";

/**
 * 「インタビューを終了する」用のフック。
 *
 * レポート未生成のまま終了するとセッションが active（=「中断中」）のまま残り、
 * 中断扱い・再開導線が表示されてしまう。終了時はセッションをアーカイブして
 * status を none にし、中断扱いを解消したうえで法案詳細ページへ遷移する。
 * アーカイブに失敗してもユーザーは離脱させる（status が変わらなくても致命的ではない）。
 */
export function useEndInterview(
  sessionId: string,
  billId: string,
  previewToken?: string
) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const endInterview = async () => {
    setIsEnding(true);
    try {
      const result = await archiveInterviewSession(sessionId);
      if (!result.success) {
        console.error("Failed to archive session on end:", result.error);
      }
    } catch (error) {
      console.error("Failed to archive session on end:", error);
    }
    router.push(getBillDetailLink(billId, previewToken) as Route);
  };

  return { endInterview, isEnding };
}
