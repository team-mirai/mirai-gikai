"use client";

import { Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
    <div className="relative mx-4 rounded-xl bg-gray-100 px-6 py-4">
      <div className="flex flex-col gap-2.5">
        <p className="text-[13px] font-medium leading-none text-mirai-text text-center">
          {isSubmitted
            ? "回答ありがとうございました！"
            : "AIはあなたの考えを十分に引き出せていますか"}
        </p>
        {
          <div className="flex justify-center gap-[15px]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                onClick={() => handleRate(star)}
                className={
                  selectedRating !== null && star <= selectedRating
                    ? "fill-mirai-star text-mirai-star"
                    : "fill-white text-mirai-text-muted stroke-[0.5]"
                }
              />
            ))}
          </div>
        }
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="absolute right-2 top-2 h-[22px] w-[22px] p-0 text-mirai-text-close hover:bg-transparent hover:text-gray-500"
        aria-label="閉じる"
      >
        <X size={11} strokeWidth={2} />
      </Button>
    </div>
  );
}
