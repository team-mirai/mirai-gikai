"use client";

import { useEffect, useState } from "react";
import { calcRemainingMinutes } from "../../shared/utils/calc-remaining-minutes";

interface UseInterviewTimerProps {
  estimatedDuration: number | null | undefined;
  sessionStartedAt: string | undefined;
}

interface UseInterviewTimerResult {
  /** 残り分数。タイムマネジメント不要の場合はnull */
  remainingMinutes: number | null;
  /** 目安時間を超過したかどうか */
  isTimeUp: boolean;
}

/**
 * インタビューの残り時間を管理するフック
 *
 * 10秒ごとに残り時間を再計算する。
 * estimatedDurationがnull/undefinedの場合はタイムマネジメントしない。
 */
export function useInterviewTimer({
  estimatedDuration,
  sessionStartedAt,
}: UseInterviewTimerProps): UseInterviewTimerResult {
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(
    () => {
      if (!sessionStartedAt) return null;
      return calcRemainingMinutes(estimatedDuration, sessionStartedAt);
    }
  );

  useEffect(() => {
    if (!estimatedDuration || !sessionStartedAt) {
      setRemainingMinutes(null);
      return;
    }

    // 初回計算
    setRemainingMinutes(
      calcRemainingMinutes(estimatedDuration, sessionStartedAt)
    );

    // 10秒ごとに更新
    const interval = setInterval(() => {
      setRemainingMinutes(
        calcRemainingMinutes(estimatedDuration, sessionStartedAt)
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [estimatedDuration, sessionStartedAt]);

  return {
    remainingMinutes,
    isTimeUp: remainingMinutes !== null && remainingMinutes <= 0,
  };
}
