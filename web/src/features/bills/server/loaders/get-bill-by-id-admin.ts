import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { BillWithContent } from "../../shared/types";
import {
  findBillById,
  findMiraiStanceByBillId,
  findTagsByBillId,
} from "../repositories/bill-repository";
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

  // 基本的なbill情報、見解、コンテンツ、タグを並列取得
  // ステータスに関係なく取得（管理者用）
  const [bill, miraiStance, billContent, billTags] = await Promise.all([
    findBillById(id),
    findMiraiStanceByBillId(id),
    getBillContentWithDifficulty(id, difficultyLevel),
    findTagsByBillId(id),
  ]);

  if (!bill) {
    console.error("Failed to fetch bill");
    return null;
  }

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
