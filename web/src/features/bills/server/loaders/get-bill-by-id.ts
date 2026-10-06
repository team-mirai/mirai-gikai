import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { hideUnpublishedStance } from "../../shared/utils/hide-unpublished-stance";
import {
  findMiraiStanceByBillId,
  findPublishedBillById,
  findTagsByBillId,
} from "../repositories/bill-repository";
import { getBillContentWithDifficulty } from "./helpers/get-bill-content";

export async function getBillById(id: string): Promise<BillWithContent | null> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  const bill = await _getCachedBillById(id, difficultyLevel);
  // 賛否の予約公開はキャッシュ（10分）の外で判定し、公開日時ちょうどに切り替える
  return bill ? hideUnpublishedStance(bill, new Date()) : null;
}

const _getCachedBillById = unstable_cache(
  async (
    id: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent | null> => {
    // 基本的なbill情報、見解、コンテンツ、タグを並列取得
    // 公開ステータスの議案のみを取得
    // 見解は公開日時前のものも含めてキャッシュし、呼び出し側で除外する
    const [bill, miraiStance, billContent, billTags] = await Promise.all([
      findPublishedBillById(id),
      findMiraiStanceByBillId(id),
      getBillContentWithDifficulty(id, difficultyLevel),
      findTagsByBillId(id),
    ]);

    if (!bill) {
      console.error("Failed to fetch bill");
      return null;
    }

    // タグデータを整形
    const tags =
      billTags
        ?.map((bt) => bt.tags)
        .filter((tag): tag is { id: string; label: string } => tag !== null) ||
      [];

    return {
      ...bill,
      mirai_stance: miraiStance || undefined,
      bill_content: billContent || undefined,
      tags,
    };
  },
  ["bill-by-id"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
