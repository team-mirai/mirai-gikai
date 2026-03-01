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
};
