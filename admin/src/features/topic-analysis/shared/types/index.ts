import type { Database } from "@mirai-gikai/supabase";

// DB Row types
export type TopicAnalysisVersion =
  Database["public"]["Tables"]["topic_analysis_versions"]["Row"];
export type TopicAnalysisVersionInsert =
  Database["public"]["Tables"]["topic_analysis_versions"]["Insert"];
export type TopicAnalysisTopic =
  Database["public"]["Tables"]["topic_analysis_topics"]["Row"];
export type TopicAnalysisTopicInsert =
  Database["public"]["Tables"]["topic_analysis_topics"]["Insert"];
export type TopicAnalysisClassification =
  Database["public"]["Tables"]["topic_analysis_classifications"]["Row"];
export type TopicAnalysisClassificationInsert =
  Database["public"]["Tables"]["topic_analysis_classifications"]["Insert"];

// representative_opinions JSONB structure
export type RepresentativeOpinion = {
  session_id: string;
  opinion_title: string;
  opinion_content: string;
  source_message_content?: string | null;
  ref_id?: number | null;
};

// intermediate_results JSONB structure
export type IntermediateResults = {
  step1_raw_topics: string[];
  step2_merged_topics: string[];
  step3_classifications: Array<{
    interview_report_id: string;
    opinion_index: number;
    topic_names: string[];
  }>;
  opinions_count: number;
  sessions_count: number;
};

// Flat opinion for pipeline processing
export type FlatOpinion = {
  interview_report_id: string;
  session_id: string;
  opinion_index: number;
  title: string;
  content: string;
  source_message_id?: string | null;
  source_message_content?: string | null;
};

// フェーズ間データ受け渡し用
export type PhaseData = {
  flat_opinions?: FlatOpinion[];
  bill_title?: string;
  bill_summary?: string;
  valid_session_ids?: string[];
  raw_topics?: string[];
  merged_topic_names?: string[];
  sessions_count?: number;
  opinions_count?: number;
  classifications?: Array<{
    interview_report_id: string;
    opinion_index: number;
    topic_names: string[];
  }>;
};
