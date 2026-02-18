import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";
import { getActiveDietSession } from "./get-active-diet-session";

/**
 * 前回の国会会期を取得
 * アクティブなセッションより古いセッションを返す
 * アクティブなセッションがない場合、または古いセッションがない場合はnullを返す
 */
export async function getPreviousDietSession(): Promise<DietSession | null> {
  const activeSession = await getActiveDietSession();

  // アクティブなセッションがない場合はnullを返す
  if (!activeSession) {
    return null;
  }

  return _getCachedPreviousDietSession(activeSession.start_date);
}

const _getCachedPreviousDietSession = unstable_cache(
  async (activeStartDate: string): Promise<DietSession | null> => {
    const supabase = createAdminClient();

    // アクティブなセッションより古いセッションを取得（start_dateで比較）
    const { data: previousSession, error: previousError } = await supabase
      .from("diet_sessions")
      .select("*")
      .lt("start_date", activeStartDate)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousError) {
      console.error("Failed to fetch previous diet session:", previousError);
      return null;
    }

    return previousSession;
  },
  ["previous-diet-session"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
