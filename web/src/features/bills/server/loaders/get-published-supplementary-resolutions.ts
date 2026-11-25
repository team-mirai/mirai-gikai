import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { PublishedSupplementaryResolution } from "../../shared/types";
import { findPublishedSupplementaryResolutionsByBillId } from "../repositories/bill-repository";

/**
 * 議案の公開済みの附帯決議を取得する（議案詳細ページ用）
 */
export const getPublishedSupplementaryResolutions = unstable_cache(
  async (billId: string): Promise<PublishedSupplementaryResolution[]> =>
    findPublishedSupplementaryResolutionsByBillId(billId),
  ["published-supplementary-resolutions"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
