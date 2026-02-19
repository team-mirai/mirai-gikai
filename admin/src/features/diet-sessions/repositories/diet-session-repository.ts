import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findAllDietSessions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diet_sessions")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`国会会期の取得に失敗しました: ${error.message}`);
  }

  return data;
}

export async function createDietSessionRecord(input: {
  name: string;
  slug: string | null;
  shugiin_url: string | null;
  start_date: string;
  end_date: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diet_sessions")
    .insert({
      name: input.name,
      slug: input.slug,
      shugiin_url: input.shugiin_url,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`国会会期の作成に失敗しました: ${error.message}`);
  }

  return data;
}

export async function updateDietSessionRecord(
  id: string,
  input: {
    name: string;
    slug: string | null;
    shugiin_url: string | null;
    start_date: string;
    end_date: string;
  }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diet_sessions")
    .update({
      name: input.name,
      slug: input.slug,
      shugiin_url: input.shugiin_url,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`国会会期の更新に失敗しました: ${error.message}`);
  }

  return data;
}

export async function deleteDietSessionRecord(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("diet_sessions").delete().eq("id", id);

  if (error) {
    throw new Error(`国会会期の削除に失敗しました: ${error.message}`);
  }
}

export async function setActiveDietSessionRecord(id: string) {
  const supabase = createAdminClient();
  const { error: rpcError } = await supabase.rpc("set_active_diet_session", {
    target_session_id: id,
  });

  if (rpcError) {
    throw new Error(
      `アクティブセッションの設定に失敗しました: ${rpcError.message}`
    );
  }
}

export async function findDietSessionById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diet_sessions")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`セッション情報の取得に失敗しました: ${error.message}`);
  }

  return data;
}
