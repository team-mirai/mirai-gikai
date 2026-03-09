"use client";

import { Clock } from "lucide-react";

interface InterviewTimerProps {
  remainingMinutes: number;
}

/**
 * インタビューの残り目安時間を表示するコンポーネント
 *
 * - 分単位で表示（秒は非表示、急かさない）
 * - 残り5分以下で警告色
 * - 残り0分で超過表示
 */
export function InterviewTimer({ remainingMinutes }: InterviewTimerProps) {
  const isOver = remainingMinutes <= 0;

  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Clock className="h-3.5 w-3.5" />
      {isOver ? (
        <span>目安時間超過</span>
      ) : (
        <span>残り約 {remainingMinutes} 分</span>
      )}
    </div>
  );
}
