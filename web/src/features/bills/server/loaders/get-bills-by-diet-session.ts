import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { fetchTagsByBillIds } from "./helpers/get-bill-tags";

/**
 * 国会会期IDに紐づく議案一覧を取得
 */
export async function getBillsByDietSession(
  dietSessionId: string
): Promise<BillWithContent[]> {
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedBillsByDietSession(dietSessionId, difficultyLevel);
}

const _getCachedBillsByDietSession = unstable_cache(
  async (
    dietSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent[]> => {
    const supabase = createAdminClient();

    // 会期IDに紐づく公開済み議案を取得
    const { data, error } = await supabase
      .from("bills")
      .select(
        `
        *,
        bill_contents!inner (
          id,
          bill_id,
          title,
          summary,
          content,
          difficulty_level,
          created_at,
          updated_at
        )
      `
      )
      .eq("diet_session_id", dietSessionId)
      .eq("publish_status", "published")
      .eq("bill_contents.difficulty_level", difficultyLevel)
      .order("published_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch bills by diet session: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    // タグ情報を一括取得
    const billIds = data.map((item) => item.id);
    const tagsByBillId = await fetchTagsByBillIds(supabase, billIds);

    const billsWithContent: BillWithContent[] = data.map((item) => {
      const { bill_contents, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) ?? [],
      };
    });

    return billsWithContent;
  },
  ["bills-by-diet-session"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);
