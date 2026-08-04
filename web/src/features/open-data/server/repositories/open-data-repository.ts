import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { OpenDataCursor } from "../../shared/utils/cursor";

export type OpenDataReportRow = {
  report_id: string;
  bill_id: string;
  bill_name: string;
  stance: string | null;
  role: string | null;
  role_title: string | null;
  role_description: string | null;
  summary: string | null;
  opinions: unknown;
  interview_session_id: string;
  created_at: string;
};

/**
 * 二次利用許諾済みの公開レポートを新しい順に取得する。
 * フィルタ条件（公開フラグ × 二次利用許諾 × 公開議案 × k-匿名性ゲート）は
 * DB function 側に集約している。
 */
export async function findOpenDataReports(params: {
  minPublicReports: number;
  limit: number;
  cursor: OpenDataCursor | null;
}): Promise<OpenDataReportRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    "find_open_data_interview_reports",
    {
      p_min_public_reports: params.minPublicReports,
      p_limit: params.limit,
      ...(params.cursor
        ? {
            p_cursor_created_at: params.cursor.createdAt,
            p_cursor_id: params.cursor.id,
          }
        : {}),
    }
  );

  if (error) {
    throw new Error(`Failed to fetch open data reports: ${error.message}`);
  }
  return data ?? [];
}

export type OpenDataMessageRow = {
  interview_session_id: string;
  role: "assistant" | "user";
  content: string;
};

/**
 * セッションIDの集合に対する会話ログを作成日時昇順で取得する。
 */
export async function findMessagesBySessionIds(
  sessionIds: string[]
): Promise<OpenDataMessageRow[]> {
  if (sessionIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("interview_session_id, role, content")
    .in("interview_session_id", sessionIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch open data messages: ${error.message}`);
  }
  return data ?? [];
}

/**
 * レートリミットカウンタを加算し、制限内かを返す。
 */
export async function consumeRateLimit(params: {
  key: string;
  windowStart: string;
  limit: number;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("increment_api_rate_limit", {
    p_key: params.key,
    p_window_start: params.windowStart,
    p_limit: params.limit,
  });

  if (error) {
    throw new Error(`Failed to consume rate limit: ${error.message}`);
  }
  return data === true;
}
