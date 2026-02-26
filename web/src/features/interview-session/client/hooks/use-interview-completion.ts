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
      const result = await callCompleteApi({
        sessionId,
        isPublic,
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
