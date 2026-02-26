import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

/**
 * 有識者登録を作成
 */
export async function createExpertRegistration(params: {
  interviewSessionId: string;
  name: string;
  affiliation: string;
  email: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expert_registrations")
    .insert({
      interview_session_id: params.interviewSessionId,
      name: params.name,
      affiliation: params.affiliation,
      email: params.email,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create expert registration: ${error.message}`);
  }

  return data;
}

/**
 * セッションIDで有識者登録が存在するか確認
 */
export async function findExpertRegistrationBySessionId(sessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expert_registrations")
    .select("id")
    .eq("interview_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check expert registration: ${error.message}`);
  }

  return data;
}

/**
 * メールアドレスで有識者登録が存在するか確認
 */
export async function findExpertRegistrationByEmail(email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expert_registrations")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to check expert registration by email: ${error.message}`
    );
  }

  return data;
}
