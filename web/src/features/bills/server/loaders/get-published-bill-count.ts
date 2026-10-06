import "server-only";

import { unstable_cache } from "next/cache";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { countPublishedBillsByDietSession } from "../repositories/bill-repository";

/**
 * 会期ごとの公開議案数（キャッシュ付き）。
 * 前回の国会セクションと過去の会期一覧で同じキャッシュを共有する。
 */
export const getPublishedBillCount = unstable_cache(
  async (
    dietSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<number> =>
    countPublishedBillsByDietSession(dietSessionId, difficultyLevel),
  ["published-bill-count-by-session"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
