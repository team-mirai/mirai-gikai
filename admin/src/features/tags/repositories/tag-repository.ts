import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findAllTagsWithBillCount() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .select(
      `
      id,
      label,
      description,
      featured_priority,
      created_at,
      updated_at,
      bills_tags(count)
    `
    )
    .order("featured_priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`タグの取得に失敗しました: ${error.message}`);
  }

  return data;
}

export async function createTagRecord(input: { label: string }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ label: input.label })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: { code: error.code, message: error.message },
      };
    }
    throw new Error(`タグの作成に失敗しました: ${error.message}`);
  }

  return { data, error: null };
}

export async function updateTagRecord(
  id: string,
  input: {
    label: string;
    description?: string | null;
    featured_priority?: number | null;
  }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .update({
      label: input.label,
      description: input.description,
      featured_priority: input.featured_priority,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: { code: error.code, message: error.message },
      };
    }
    if (error.code === "PGRST116") {
      return {
        data: null,
        error: { code: error.code, message: error.message },
      };
    }
    throw new Error(`タグの更新に失敗しました: ${error.message}`);
  }

  return { data, error: null };
}

export async function deleteTagRecord(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    if (error.code === "PGRST116") {
      return { error: { code: error.code, message: error.message } };
    }
    throw new Error(`タグの削除に失敗しました: ${error.message}`);
  }

  return { error: null };
}
