import type { Database } from "@mirai-gikai/supabase";

export type InterviewReport =
  Database["public"]["Tables"]["interview_report"]["Row"];
export type InterviewReportInsert =
  Database["public"]["Tables"]["interview_report"]["Insert"];
