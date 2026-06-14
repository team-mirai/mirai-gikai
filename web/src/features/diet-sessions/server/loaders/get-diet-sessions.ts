import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findDietSessions } from "../repositories/diet-session-repository";

export async function getDietSessions(): Promise<DietSession[]> {
  return _getCachedDietSessions();
}

const _getCachedDietSessions = unstable_cache(
  async (): Promise<DietSession[]> => {
    return findDietSessions();
  },
  ["diet-sessions-list"],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
