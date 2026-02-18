import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { getPreviousDietSession } from "@/features/diet-sessions/server/loaders/get-previous-diet-session";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { fetchTagsByBillIds } from "./helpers/get-bill-tags";

const MAX_PREVIEW_BILLS = 5;

export type PreviousSessionBillsResult = {
  session: DietSession;
  bills: BillWithContent[];
  totalBillCount: number;
} | null;

/**
 * 前回の国会会期とその議案を取得（プレビュー用、最大5件）
 * 前回の会期がない場合はnullを返す
 */
export async function getPreviousSessionBills(): Promise<PreviousSessionBillsResult> {
  const previousSession = await getPreviousDietSession();
  if (!previousSession) {
    return null;
  }

  const difficultyLevel = await getDifficultyLevel();
  const [bills, totalBillCount] = await Promise.all([
    _getCachedPreviousSessionBills(previousSession.id, difficultyLevel),
    _getCachedPreviousSessionBillCount(previousSession.id, difficultyLevel),
  ]);

  return {
    session: previousSession,
    bills,
    totalBillCount,
  };
}

const _getCachedPreviousSessionBills = unstable_cache(
  async (
    dietSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent[]> => {
    const supabase = createAdminClient();

    // 会期IDに紐づく公開済み議案を取得（最大5件）
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
      .order("published_at", { ascending: false })
      .limit(MAX_PREVIEW_BILLS);

    if (error) {
      console.error("Failed to fetch previous session bills:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // タグ情報を取得
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
  ["previous-session-bills"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS],
  }
);

const _getCachedPreviousSessionBillCount = unstable_cache(
  async (
    dietSessionId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<number> => {
    const supabase = createAdminClient();

    const { count, error } = await supabase
      .from("bills")
      .select("*, bill_contents!inner(difficulty_level)", {
        count: "exact",
        head: true,
      })
      .eq("diet_session_id", dietSessionId)
      .eq("publish_status", "published")
      .eq("bill_contents.difficulty_level", difficultyLevel);

    if (error) {
      console.error("Failed to count previous session bills:", error);
      return 0;
    }

    return count ?? 0;
  },
  ["previous-session-bill-count"],
  {
    revalidate: 600,
    tags: [CACHE_TAGS.BILLS],
  }
);
