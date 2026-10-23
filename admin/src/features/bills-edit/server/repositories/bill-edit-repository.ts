import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import { BILL_THUMBNAILS_BUCKET } from "../../shared/constants";
import type { BillInsert } from "../../shared/types";
import type { DifficultyLevel } from "../../shared/types/bill-contents";
import type { BillVideosInput } from "../../shared/types/bill-videos";
import { mapBillDbError } from "../../shared/utils/map-bill-db-error";
import { toBillVideoChanges } from "../../shared/utils/to-bill-video-changes";

export async function findBillById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  return data;
}

export async function findBillIdById(id: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  return data?.id ?? null;
}

export async function findBillContentsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId)
    .order("difficulty_level");

  if (error) {
    throw new Error(`Failed to fetch bill contents: ${error.message}`);
  }

  return data ?? [];
}

export async function findBillTagIdsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("tag_id")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill tag ids: ${error.message}`);
  }

  return data?.map((item) => item.tag_id) ?? [];
}

export async function findBillBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill by slug: ${error.message}`);
  }

  return data;
}

export async function createBillRecord(insertData: BillInsert) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    throw new Error(mapBillDbError(error, "create"));
  }

  return data;
}

export async function updateBillRecord(
  id: string,
  updateData: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bills")
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw new Error(mapBillDbError(error, "update"));
  }
}

export async function upsertBillContent(params: {
  billId: string;
  difficultyLevel: DifficultyLevel;
  title: string;
  summary: string;
  content: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("bill_contents").upsert(
    {
      bill_id: params.billId,
      difficulty_level: params.difficultyLevel,
      title: params.title,
      summary: params.summary,
      content: params.content,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "bill_id,difficulty_level",
    }
  );

  if (error) {
    throw new Error(
      `Failed to upsert bill content (${params.difficultyLevel}): ${error.message}`
    );
  }
}

export async function findBillsTagsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("tag_id")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill tags: ${error.message}`);
  }

  return data?.map((t) => t.tag_id) ?? [];
}

export async function deleteBillsTags(billId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bills_tags")
    .delete()
    .eq("bill_id", billId)
    .in("tag_id", tagIds);

  if (error) {
    throw new Error(`Failed to delete bill tags: ${error.message}`);
  }
}

export async function createBillsTags(billId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  const billTags = tagIds.map((tagId) => ({
    bill_id: billId,
    tag_id: tagId,
  }));

  const { error } = await supabase.from("bills_tags").insert(billTags);

  if (error) {
    throw new Error(`Failed to create bill tags: ${error.message}`);
  }
}

export async function findBillVideosByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_videos")
    .select("*")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill videos: ${error.message}`);
  }

  return data ?? [];
}

/**
 * 議論の種類ごとに動画を登録・更新し、空にされた種類の動画は削除する。
 * 種類ごとに独立した行のため、途中で失敗しても再保存で揃えられるとして RPC にはしない
 */
export async function saveBillVideos(billId: string, videos: BillVideosInput) {
  const supabase = createAdminClient();
  const { upserts, deleteKinds } = toBillVideoChanges(billId, videos);

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("bill_videos")
      .upsert(upserts, { onConflict: "bill_id,kind" });
    if (error) {
      throw new Error(`Failed to save bill videos: ${error.message}`);
    }
  }

  if (deleteKinds.length > 0) {
    const { error } = await supabase
      .from("bill_videos")
      .delete()
      .eq("bill_id", billId)
      .in("kind", deleteKinds);
    if (error) {
      throw new Error(`Failed to delete bill videos: ${error.message}`);
    }
  }
}

export async function uploadBillThumbnailFile(params: {
  fileName: string;
  body: ArrayBuffer;
  contentType: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BILL_THUMBNAILS_BUCKET)
    .upload(params.fileName, params.body, {
      contentType: params.contentType,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to upload bill thumbnail: ${error.message}`);
  }

  return supabase.storage.from(BILL_THUMBNAILS_BUCKET).getPublicUrl(data.path)
    .data.publicUrl;
}
