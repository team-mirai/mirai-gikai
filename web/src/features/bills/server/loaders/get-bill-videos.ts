import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillVideo } from "../../shared/types";
import { findVideosByBillId } from "../repositories/bill-repository";

/**
 * 議案に紐づく動画を取得する（議案詳細ページ用）
 */
export const getBillVideos = unstable_cache(
  async (billId: string): Promise<BillVideo[]> => findVideosByBillId(billId),
  ["bill-videos"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
