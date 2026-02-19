import type { TagWithBillCount } from "../../shared/types";
import { findAllTagsWithBillCount } from "../repositories/tag-repository";

export async function loadTags(): Promise<TagWithBillCount[]> {
  const data = await findAllTagsWithBillCount();

  // データを整形
  return (
    data?.map((tag) => ({
      id: tag.id,
      label: tag.label,
      description: tag.description,
      featured_priority: tag.featured_priority,
      created_at: tag.created_at,
      updated_at: tag.updated_at,
      bill_count: tag.bills_tags?.[0]?.count ?? 0,
    })) || []
  );
}
