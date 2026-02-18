import { createAdminClient } from "@mirai-gikai/supabase";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { BillWithContent } from "../../shared/types";
import { getBillContentWithDifficulty } from "./helpers/get-bill-content";

/**
 * 管理者用: 公開/非公開問わず議案を取得
 * プレビュー機能で使用
 * キャッシュなしで常に最新のデータを取得
 */
export async function getBillByIdAdmin(
  id: string
): Promise<BillWithContent | null> {
  const difficultyLevel = await getDifficultyLevel();
  const supabase = createAdminClient();

  // 基本的なbill情報、見解、コンテンツ、タグを並列取得
  // ステータスに関係なく取得（管理者用）
  const [billResult, miraiStanceResult, billContent, tagsResult] =
    await Promise.all([
      supabase.from("bills").select("*").eq("id", id).single(),
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
      .filter((tag): tag is { id: string; label: string } => tag !== null) ??
    [];

  return {
    ...bill,
    mirai_stance: miraiStance || undefined,
    bill_content: billContent || undefined,
    tags,
  };
}
