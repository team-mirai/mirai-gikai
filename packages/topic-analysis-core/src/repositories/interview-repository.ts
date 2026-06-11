import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * インタビュー設定を取得する。再抽出のプロンプト構築に使う。
 * 存在しなければ null（PGRST116）。
 */
export async function findInterviewConfigById(configId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch interview config: ${error.message}`);
  }

  return data;
}

/** インタビューセッションを取得する。存在しなければ null（呼び出し側でスキップ判定）。 */
export async function findInterviewSessionById(sessionId: string) {
  const supabase = createAdminClient();
  // 未存在を例外ではなく null で返すため maybeSingle を使う
  // （reextract の「session not found → skipped」分岐を到達可能にする）。
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch interview session: ${error.message}`);
  }

  return data;
}

/** セッションの全メッセージを作成順で取得する。 */
export async function findInterviewMessagesBySessionId(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("interview_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch interview messages: ${error.message}`);
  }

  return data;
}

/**
 * 議案と bill_contents（normal 優先）を取得し、プロンプト接地用に整形する。
 */
export async function fetchBillWithContents(billId: string) {
  const supabase = createAdminClient();

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single();

  if (billError) {
    throw new Error(`Failed to fetch bill: ${billError.message}`);
  }

  const { data: contents, error: contentsError } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId);

  if (contentsError) {
    throw new Error(`Failed to fetch bill contents: ${contentsError.message}`);
  }

  const normalContent = contents.find((c) => c.difficulty_level === "normal");

  return {
    bill,
    billTitle: normalContent?.title ?? bill.name,
    billContent: normalContent?.content ?? "",
    billSummary: normalContent?.summary ?? "",
  };
}
