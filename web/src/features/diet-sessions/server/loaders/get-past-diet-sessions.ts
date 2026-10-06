import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SluggedDietSession } from "../../shared/types";
import { findDietSessionsBefore } from "../repositories/diet-session-repository";
import { getActiveDietSession } from "./get-active-diet-session";

/**
 * アクティブな会期より前の会期を新しい順にすべて取得する。
 * アクティブな会期がない場合は空配列を返す（前回の国会セクションと揃える）。
 */
export async function getPastDietSessions(): Promise<SluggedDietSession[]> {
  const activeSession = await getActiveDietSession();
  if (!activeSession) {
    return [];
  }

  return _getCachedPastDietSessions(activeSession.start_date);
}

const _getCachedPastDietSessions = unstable_cache(
  async (activeStartDate: string): Promise<SluggedDietSession[]> =>
    findDietSessionsBefore(activeStartDate),
  ["past-diet-sessions"],
  { revalidate: 3600, tags: [CACHE_TAGS.DIET_SESSIONS] }
);
