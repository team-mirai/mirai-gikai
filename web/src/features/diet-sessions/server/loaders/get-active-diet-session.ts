import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findActiveDietSession } from "../repositories/diet-session-repository";

/**
 * アクティブな国会会期を取得
 * is_active = true の会期を返す
 * アクティブな会期がない場合は null を返す
 */
export async function getActiveDietSession(): Promise<DietSession | null> {
  return _getCachedActiveDietSession();
}

const _getCachedActiveDietSession = unstable_cache(
  async (): Promise<DietSession | null> => {
    return findActiveDietSession();
  },
  ["active-diet-session"],
  {
    revalidate: 3600, // 1 hour
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
