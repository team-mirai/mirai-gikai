import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
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

// 一覧では本文（content）を含めず、詳細でのみ含める。
// as const で template literal 型を保ち、Supabase の行型推論を効かせる
const openDataBillSelect = <C extends string>(contentColumns: C) =>
  `
  id,
  name,
  status,
  status_note,
  originating_house,
  submitted_date,
  published_at,
  created_at,
  bill_contents!inner (${contentColumns}),
  mirai_stances (type, comment),
  bills_tags (tags (id, label))
` as const;

/**
 * 公開中の議案を難易度別コンテンツ・チームみらいの賛否・タグ付きで
 * 新しい順（created_at DESC, id DESC）に取得する。
 * 指定難易度のコンテンツが存在しない議案は含めない。
 */
export async function findOpenDataPublishedBills(params: {
  limit: number;
  cursor: OpenDataCursor | null;
  difficulty: DifficultyLevelEnum;
}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("bills")
    .select(openDataBillSelect("title, summary"))
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", params.difficulty);

  if (params.cursor) {
    // カーソル値は decodeCursor で ISO タイムスタンプ・UUID 形式に
    // 検証済みのため、フィルタ文字列に安全に埋め込める
    const { createdAt, id } = params.cursor;
    query = query.or(
      `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(params.limit);

  if (error) {
    throw new Error(`Failed to fetch open data bills: ${error.message}`);
  }
  return data;
}

/**
 * 公開中の議案を1件、難易度別コンテンツ・チームみらいの賛否・タグ付きで取得する。
 * 非公開・存在しない・指定難易度のコンテンツがない場合は null。
 */
export async function findOpenDataPublishedBillById(params: {
  billId: string;
  difficulty: DifficultyLevelEnum;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select(openDataBillSelect("title, summary, content"))
    .eq("id", params.billId)
    .eq("publish_status", "published")
    .eq("bill_contents.difficulty_level", params.difficulty)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch open data bill: ${error.message}`);
  }
  return data;
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
