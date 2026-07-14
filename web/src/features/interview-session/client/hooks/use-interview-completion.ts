"use client";

import { useState } from "react";
import { getInterviewReportCompleteLink } from "@/features/interview-config/shared/utils/interview-links";
import { callCompleteApi } from "../utils/interview-api-client";

interface UseInterviewCompletionProps {
  sessionId: string;
}

/**
 * インタビュー完了処理を管理するフック
 */
export function useInterviewCompletion({
  sessionId,
}: UseInterviewCompletionProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const handleSubmit = async (isPublic: boolean) => {
    setIsCompleting(true);
    setCompleteError(null);
    try {
      // 新利用規約の告知（オープンデータとしての第三者提供）を表示した上で
      // 得た公開同意なので、二次利用同意もこのクライアントが明示的に送る
      const result = await callCompleteApi({
        sessionId,
        isPublic,
        isDataReuseConsented: isPublic,
      });
      const reportId = result.report?.id;
      if (reportId) {
        window.location.href = getInterviewReportCompleteLink(reportId);
      }
      // 画面遷移するまで isCompleting を true のままにする
    } catch (err) {
      setCompleteError(
        err instanceof Error ? err.message : "Failed to complete interview"
      );
      setIsCompleting(false);
    }
  };

  return {
    isCompleting,
    completeError,
    handleSubmit,
  };
}
