"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitInterviewRating } from "../../server/actions/submit-interview-rating";

interface InterviewRatingWidgetProps {
  sessionId: string;
  onDismiss: () => void;
}

/**
 * インタビュー中にプログレスが70%に達した時に表示される星評価ウィジェット
 * 評価選択後は「回答ありがとうございました！」を表示し、2〜3秒で自動非表示
 */
export function InterviewRatingWidget({
  sessionId,
  onDismiss,
}: InterviewRatingWidgetProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRate = useCallback(
    async (rating: number) => {
      setSelectedRating(rating);
      setIsSubmitted(true);

      try {
        await submitInterviewRating(sessionId, rating);
      } catch {
        // 評価の保存失敗はサイレントに無視（UXを妨げない）
      }
    },
    [sessionId]
  );

  // 評価送信後、2.5秒で自動非表示
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, onDismiss]);

  return (
    <div className="mx-4 flex items-center gap-3 rounded-[18px] bg-[#F3F4F6] px-5 py-4">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <p className="text-sm font-bold text-[#1F2937]">
          {isSubmitted
            ? "回答ありがとうございました！"
            : "AIはあなたの考えを十分に引き出せていますか"}
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              variant="ghost"
              size="icon"
              onClick={() => !isSubmitted && handleRate(star)}
              disabled={isSubmitted}
              className="h-auto w-auto p-0 hover:bg-transparent disabled:cursor-default disabled:opacity-100"
              aria-label={`${star}星`}
            >
              <Star
                size={32}
                className={
                  selectedRating !== null && star <= selectedRating
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : "fill-none text-[#D1D5DB] stroke-[1.5]"
                }
              />
            </Button>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="shrink-0 text-[#9CA3AF] hover:bg-transparent hover:text-[#6B7280]"
        aria-label="閉じる"
      >
        <X size={24} />
      </Button>
    </div>
  );
}
