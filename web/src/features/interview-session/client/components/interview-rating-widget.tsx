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
    <div className="relative mx-4 rounded-xl bg-[#EDEDED] px-6 py-4">
      <div className="flex flex-col gap-2.5">
        <p className="text-[13px] font-medium leading-none text-[#1F2937]">
          {isSubmitted
            ? "回答ありがとうございました！"
            : "AIはあなたの考えを十分に引き出せていますか"}
        </p>
        {!isSubmitted && (
          <div className="flex justify-center gap-[15px]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="icon"
                onClick={() => handleRate(star)}
                className="h-auto w-auto p-0 hover:bg-transparent"
                aria-label={`${star}星`}
              >
                <Star
                  size={25}
                  className={
                    selectedRating !== null && star <= selectedRating
                      ? "fill-[#FF9500] text-[#FF9500]"
                      : "fill-white text-[#8E9092] stroke-[0.5]"
                  }
                />
              </Button>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="absolute right-2 top-2 h-[22px] w-[22px] p-0 text-[#9F9B9B] hover:bg-transparent hover:text-[#6B7280]"
        aria-label="閉じる"
      >
        <X size={11} strokeWidth={2} />
      </Button>
    </div>
  );
}
