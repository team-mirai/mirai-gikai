import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { DietSession } from "../../shared/types";

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
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("diet_sessions")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch diet session by slug:", error);
      return null;
    }

    return data;
  },
  ["diet-session-by-slug"],
  {
    revalidate: 3600, // 1時間
    tags: [CACHE_TAGS.DIET_SESSIONS],
  }
);
