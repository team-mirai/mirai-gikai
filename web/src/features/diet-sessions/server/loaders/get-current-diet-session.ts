import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { findCurrentDietSession } from "../repositories/diet-session-repository";

/**
 * 指定日時点で開催中の国会会期を取得
 * 指定日が開始日と終了日の範囲内にある会期を返す
 */
export async function getCurrentDietSession(
  date: Date
): Promise<DietSession | null> {
  // YYYY-MM-DD形式に変換
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const targetDate = `${year}-${month}-${day}`;

  return _getCachedCurrentDietSession(targetDate);
}

const _getCachedCurrentDietSession = unstable_cache(
  async (targetDate: string): Promise<DietSession | null> => {
    return findCurrentDietSession(targetDate);
  },
  ["current-diet-session"],
  {
    revalidate: 3600, // 1時間（3600秒）
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
