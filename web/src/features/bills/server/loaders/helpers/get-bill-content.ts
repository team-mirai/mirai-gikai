import { createAdminClient } from "@mirai-gikai/supabase";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";

/**
 * 指定された難易度の議案コンテンツを取得
 * @param billId 議案ID
 * @param difficultyLevel 難易度レベル
 */
export async function getBillContentWithDifficulty(
  billId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  const supabase = createAdminClient();

  // 選択された難易度のコンテンツを取得
  const { data: billContent, error } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId)
    .eq("difficulty_level", difficultyLevel)
    .single();

  if (error) {
    console.error(`Failed to fetch bill content: ${error.message}`);
    return null;
  }

  return billContent;
}
