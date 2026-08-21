import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillTag } from "../../shared/types";
import { findFeaturedTags } from "../repositories/bill-repository";

/**
 * 絞り込みに出すタグ。featured_priority を持つタグを優先度順に返す。
 *
 * 法案側には運用途中のタグ（省庁名・委員会名など）も付いているため、法案から
 * タグを集めると選べるカテゴリが数十件に膨らむ。出すのは featured だけにする。
 */
export async function getFeaturedTags(): Promise<BillTag[]> {
  return _getCachedFeaturedTags();
}

const _getCachedFeaturedTags = unstable_cache(
  async (): Promise<BillTag[]> => {
    const tags = await findFeaturedTags();

    return tags.map((tag) => ({ id: tag.id, label: tag.label }));
  },
  ["featured-tags"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
