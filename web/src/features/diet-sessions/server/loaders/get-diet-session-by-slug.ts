import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findDietSessionBySlug } from "../repositories/diet-session-repository";

/**
 * slugで国会会期を取得
 */
export async function getDietSessionBySlug(
  slug: string
): Promise<DietSession | null> {
  return _getCachedDietSessionBySlug(slug);
}

const _getCachedDietSessionBySlug = unstable_cache(
  async (slug: string): Promise<DietSession | null> => {
    return findDietSessionBySlug(slug);
  },
  ["diet-session-by-slug"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
