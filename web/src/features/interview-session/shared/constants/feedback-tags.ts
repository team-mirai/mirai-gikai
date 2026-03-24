export const FEEDBACK_TAGS = [
  "irrelevant_questions",
  "not_aligned",
  "misunderstood",
  "too_many_questions",
  "other",
] as const;

export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];

export const FEEDBACK_TAG_LABELS: Record<FeedbackTag, string> = {
  irrelevant_questions: "質問が的外れ",
  not_aligned: "話が噛み合わない",
  misunderstood: "言いたいことと違う",
  too_many_questions: "質問が多い",
  other: "その他",
};

/** 星評価がこの値以下の場合にフィードバックタグを表示する */
export const FEEDBACK_RATING_THRESHOLD = 3;
