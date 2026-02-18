import { createAdminClient } from "@mirai-gikai/supabase";
import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { getBillContentWithDifficulty } from "./helpers/get-bill-content";

export async function getBillById(id: string): Promise<BillWithContent | null> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedBillById(id, difficultyLevel);
}

const _getCachedBillById = unstable_cache(
  async (
    id: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent | null> => {
    const supabase = createAdminClient();

    // 基本的なbill情報、見解、コンテンツ、タグを並列取得
    // 公開ステータスの議案のみを取得
    const [billResult, miraiStanceResult, billContent, tagsResult] =
      await Promise.all([
        supabase
          .from("bills")
          .select("*")
          .eq("id", id)
          .eq("publish_status", "published") // 公開済み議案のみ
          .single(),
        supabase.from("mirai_stances").select("*").eq("bill_id", id).single(),
        getBillContentWithDifficulty(id, difficultyLevel),
        supabase.from("bills_tags").select("tags(id, label)").eq("bill_id", id),
      ]);

    const { data: bill, error: billError } = billResult;
    if (billError || !bill) {
      console.error("Failed to fetch bill:", billError);
      return null;
    }

    const { data: miraiStance } = miraiStanceResult;
    const { data: billTags } = tagsResult;

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
