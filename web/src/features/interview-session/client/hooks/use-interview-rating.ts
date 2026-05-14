"use client";

import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewProgress } from "../../shared/utils/calc-interview-progress";
import { isLoopFamilyMode } from "../../shared/utils/is-loop-family-mode";

const RATING_WIDGET_THRESHOLD = 65;

interface UseInterviewRatingProps {
  mode?: InterviewMode;
  progress: InterviewProgress | null;
  hasRated?: boolean;
}

/**
 * 評価ウィジェットの表示制御を管理するhook
 * loop / targeted モードでプログレスが閾値に達したら1回だけ表示
 * 既に評価済み（hasRated=true）の場合は表示しない
 */
export function useInterviewRating({
  mode,
  progress,
  hasRated,
}: UseInterviewRatingProps) {
  const ratingTriggered = useRef(!!hasRated);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (
      !ratingTriggered.current &&
      isLoopFamilyMode(mode) &&
      progress &&
      progress.percentage >= RATING_WIDGET_THRESHOLD
    ) {
      ratingTriggered.current = true;
      setShowRating(true);
    }
  }, [progress, mode]);

  const handleRatingDismiss = useCallback(() => {
    setShowRating(false);
  }, []);

  return { showRating, handleRatingDismiss };
}
