import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { getActiveDietSession } from "@/features/diet-sessions/server/loaders/get-active-diet-session";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import {
  findFeaturedBillsWithContents,
  findTagsByBillIds,
} from "../repositories/bill-repository";

/**
 * 注目の議案を取得する
 * is_featured = true でアクティブな国会会期の公開済み議案を最新順に取得
 * アクティブな国会会期がない場合は全件取得
 */
export async function getFeaturedBills(): Promise<BillWithContent[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  const activeSession = await getActiveDietSession();

  return _getCachedFeaturedBills(difficultyLevel, activeSession?.id ?? null);
}

const _getCachedFeaturedBills = unstable_cache(
  async (
    difficultyLevel: DifficultyLevelEnum,
    dietSessionId: string | null
  ): Promise<BillWithContent[]> => {
    const data = await findFeaturedBillsWithContents(
      difficultyLevel,
      dietSessionId
    );

    if (data.length === 0) {
      return [];
    }

    // タグ情報を一括取得
    const billIds = data.map((item: { id: string }) => item.id);
    const tagsByBillId = await findTagsByBillIds(billIds);

    // データ構造を整形
    return data.map((item) => {
      const { bill_contents, ...bill } = item;
      return {
        ...bill,
        bill_content: Array.isArray(bill_contents)
          ? bill_contents[0]
          : undefined,
        tags: tagsByBillId.get(item.id) || [],
      };
    }) as BillWithContent[];
  },
  ["featured-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
