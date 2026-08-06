import type { ReasoningType } from "@mirai-gikai/shared/interview-report/opinion-tags";

/** ビューアが扱う意見1件。 */
export type ViewerOpinion = {
  id: string;
  title: string;
  content: string;
  contextualQuote: string | null;
  billSentiment: "期待" | "懸念" | null;
  richness: number | null;
  concern: string | null;
  proposal: string | null;
  reasoningTypes: ReasoningType[];
  /** 発言者の立場タイプ（interview_report.role）。 */
  role: string | null;
  /** 発言者の立場の短縮タイトル。 */
  roleTitle: string | null;
};

/** 中トピック（葉）。意見が紐づくのはここだけ。 */
export type ViewerMediumTopic = {
  id: string;
  title: string;
  description: string;
  opinions: ViewerOpinion[];
};

/** 大トピック。件数は配下の合計。 */
export type ViewerBigTopic = {
  id: string;
  title: string;
  description: string;
  mediumTopics: ViewerMediumTopic[];
  opinionCount: number;
};

/** 一覧・検索で使う、トピック名を添えた意見。 */
export type FlatOpinion = ViewerOpinion & {
  bigTopicTitle: string;
  mediumTopicTitle: string;
};

/** 階層を組む前の生のトピック行。 */
export type RawViewerTopic = {
  id: string;
  title: string;
  description: string;
  parent_topic_id: string | null;
  opinions: ViewerOpinion[];
};
