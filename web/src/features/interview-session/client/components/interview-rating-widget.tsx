"use client";

import { ArrowRight, Star, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { submitInterviewFeedback } from "../../server/actions/submit-interview-feedback";
import { submitInterviewRating } from "../../server/actions/submit-interview-rating";
import {
  FEEDBACK_RATING_THRESHOLD,
  FEEDBACK_TAG_LABELS,
  FEEDBACK_TAGS,
  type FeedbackTag,
} from "../../shared/constants/feedback-tags";

type WidgetPhase = "rating" | "feedback" | "thankyou";

// ========================================
// Phase Components
// ========================================

function RatingPhase({
  selectedRating,
  onRate,
}: {
  selectedRating: number | null;
  onRate: (rating: number) => void;
}) {
  return (
    <>
      <p className="text-[13px] font-medium leading-none text-primary-accent text-center">
        AIインタビュー改善のためのアンケート
      </p>
      <p className="text-[13px] font-medium leading-none text-mirai-text text-center">
        AIはあなたの考えを十分に引き出せていますか
      </p>
      <div className="flex justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            onClick={() => onRate(star)}
            className="h-auto p-0 hover:bg-transparent"
            aria-label={`${star}つ星`}
          >
            <Star
              className={`size-6 ${
                selectedRating !== null && star <= selectedRating
                  ? "fill-mirai-star text-mirai-star"
                  : "fill-white text-mirai-text-muted stroke-[0.5]"
              }`}
            />
          </Button>
        ))}
      </div>
    </>
  );
}

function FeedbackPhase({
  selectedTags,
  onToggleTag,
  onSubmit,
}: {
  selectedTags: Set<FeedbackTag>;
  onToggleTag: (tag: FeedbackTag) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <p className="text-[13px] font-medium leading-none text-mirai-text text-center">
        気になった点を教えてください
      </p>
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_TAGS.map((tag) => (
          <Button
            key={tag}
            variant="ghost"
            onClick={() => onToggleTag(tag)}
            className={`h-auto rounded-full border px-4 py-1 text-sm font-medium ${
              selectedTags.has(tag)
                ? "border-primary bg-gradient-to-r from-mirai-gradient-start to-mirai-gradient-end text-mirai-text"
                : "border-primary bg-white text-primary-accent"
            }`}
          >
            {FEEDBACK_TAG_LABELS[tag]}
          </Button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={onSubmit}
          disabled={selectedTags.size === 0}
          className="h-auto p-0 text-[13px] font-medium text-primary-accent hover:bg-transparent disabled:opacity-40"
        >
          送信
          <ArrowRight size={14} />
        </Button>
      </div>
    </>
  );
}

function ThankYouPhase() {
  return (
    <p className="text-[13px] font-medium leading-none text-mirai-text text-center">
      回答ありがとうございました！
    </p>
  );
}

// ========================================
// Main Widget
// ========================================

interface InterviewRatingWidgetProps {
  sessionId: string;
  onDismiss: () => void;
}

/**
 * インタビュー中にプログレスが65%に達した時に表示される星評価ウィジェット
 * 星3以下の場合はフィードバックタグ選択UIを表示してから感謝メッセージを表示
 * 星4以上の場合は直接感謝メッセージを表示
 */
export function InterviewRatingWidget({
  sessionId,
  onDismiss,
}: InterviewRatingWidgetProps) {
  const [phase, setPhase] = useState<WidgetPhase>("rating");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<FeedbackTag>>(new Set());

  const handleRate = useCallback(
    async (rating: number) => {
      if (selectedRating !== null) return;
      setSelectedRating(rating);

      try {
        await submitInterviewRating(sessionId, rating);
      } catch {
        // 評価の保存失敗はサイレントに無視（UXを妨げない）
      }

      if (rating <= FEEDBACK_RATING_THRESHOLD) {
        setPhase("feedback");
      } else {
        setPhase("thankyou");
      }
    },
    [sessionId, selectedRating]
  );

  const toggleTag = useCallback((tag: FeedbackTag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const handleFeedbackSubmit = useCallback(async () => {
    const tags = Array.from(selectedTags);
    setPhase("thankyou");

    try {
      await submitInterviewFeedback(sessionId, tags);
    } catch {
      // フィードバックの保存失敗はサイレントに無視（UXを妨げない）
    }
  }, [sessionId, selectedTags]);

  const handleDismissToThankYou = useCallback(() => {
    setPhase("thankyou");
  }, []);

  // thankyouフェーズになったら2.5秒で自動非表示
  useEffect(() => {
    if (phase === "thankyou") {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phase, onDismiss]);

  return (
    <div className="relative mx-4 rounded-xl bg-gray-100 px-6 py-4">
      <div className="flex flex-col gap-2.5">
        {phase === "rating" && (
          <RatingPhase selectedRating={selectedRating} onRate={handleRate} />
        )}
        {phase === "feedback" && (
          <FeedbackPhase
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onSubmit={handleFeedbackSubmit}
          />
        )}
        {phase === "thankyou" && <ThankYouPhase />}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={phase === "feedback" ? handleDismissToThankYou : onDismiss}
        className="absolute right-2 top-2 h-[22px] w-[22px] p-0 text-mirai-text-close hover:bg-transparent hover:text-gray-500"
        aria-label="閉じる"
      >
        <X size={11} strokeWidth={2} />
      </Button>
    </div>
  );
}
