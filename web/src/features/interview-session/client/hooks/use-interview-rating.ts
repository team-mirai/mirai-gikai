"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewProgress } from "../../shared/utils/calc-interview-progress";

const RATING_WIDGET_THRESHOLD = 70;

interface UseInterviewRatingProps {
  sessionId: string;
  mode?: "loop" | "bulk";
  progress: InterviewProgress | null;
}

/**
 * 評価ウィジェットの表示制御を管理するhook
 * - loopモードでプログレスが70%に達したら1回だけ表示
 * - localStorageで永続化しリロード後も再表示しない
 */
export function useInterviewRating({
  sessionId,
  mode,
  progress,
}: UseInterviewRatingProps) {
  const ratingStorageKey = `interview-rating-${sessionId}`;
  const [ratingDismissed, setRatingDismissed] = useState(() => {
    try {
      return localStorage.getItem(ratingStorageKey) === "done";
    } catch {
      return false;
    }
  });
  const ratingTriggered = useRef(ratingDismissed);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (
      !ratingTriggered.current &&
      !ratingDismissed &&
      mode === "loop" &&
      progress &&
      progress.percentage >= RATING_WIDGET_THRESHOLD
    ) {
      ratingTriggered.current = true;
      setShowRating(true);
    }
  }, [progress, ratingDismissed, mode]);

  const handleRatingDismiss = useCallback(() => {
    setShowRating(false);
    setRatingDismissed(true);
    try {
      localStorage.setItem(ratingStorageKey, "done");
    } catch {
      // localStorage unavailable - silently ignore
    }
  }, [ratingStorageKey]);

  return { showRating, handleRatingDismiss };
}
