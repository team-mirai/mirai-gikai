// ── 分析（analyze）パイプライン ──

/** §8 フィルタ後の分析対象意見（interview_opinion 由来） */
export type TargetOpinion = {
  opinion_id: string;
  interview_report_id: string;
  opinion_index: number;
  title: string;
  content: string;
  contextual_quote: string | null;
  bill_sentiment: string | null;
  role: string | null;
};

/** 議案コンテキスト（プロンプトの接地用） */
export type BillContext = {
  name: string;
  summary: string | null;
  body: string | null;
};

/** Phase1 で抽出されるトピック候補 / Phase2 の最終トピック（保存前） */
export type TopicDraft = {
  title: string;
  description: string;
};

/** Phase3 割当用に id を振った最終トピック（id は "t0","t1"... のローカルID） */
export type FinalTopicWithId = TopicDraft & {
  local_id: string;
};

/** 意見 → トピック割当結果（topic に該当しなければ topic_local_id = null） */
export type OpinionAssignment = {
  opinion_id: string;
  topic_local_id: string | null;
};

/** topic_analysis_version.progress に格納するフェーズ間データ */
export type ProgressData = {
  bill: BillContext;
  target_opinions: TargetOpinion[];
  candidates?: TopicDraft[];
  final_topics?: FinalTopicWithId[];
};

// ── バックフィル（backfill）──

export type StoredMessage = {
  id: string;
  role: string;
  content: string;
};

export type ReextractionMessage = {
  role: string;
  content: string;
  id?: string;
};

export type BackfillTargetReport = {
  reportId: string;
  sessionId: string;
};

export type ReextractResult = {
  reportId: string;
  status: "updated" | "skipped" | "failed";
  reason?: string;
};
