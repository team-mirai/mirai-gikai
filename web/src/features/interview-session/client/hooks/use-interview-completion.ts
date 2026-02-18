"use client";

import { useState } from "react";
import { callCompleteApi } from "../utils/interview-api-client";

interface UseInterviewCompletionProps {
  sessionId: string;
  onComplete: (reportId: string | null) => void;
}

/**
 * インタビュー完了処理を管理するフック
 */
export function useInterviewCompletion({
  sessionId,
  onComplete,
}: UseInterviewCompletionProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completedReportId, setCompletedReportId] = useState<string | null>(
    null
  );

  const handleAgree = async () => {
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const result = await callCompleteApi({
        sessionId,
      });
      const reportId = result.report?.id || null;
      setCompletedReportId(reportId);
      onComplete(reportId);
    } catch (err) {
      setCompleteError(
        err instanceof Error ? err.message : "Failed to complete interview"
      );
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    isCompleting,
    completeError,
    completedReportId,
    handleAgree,
  };
}
