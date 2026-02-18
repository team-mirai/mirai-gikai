import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { getOrigin } from "@/lib/utils/url";
import type { BillWithContent } from "../../shared/types";

/**
 * シェアURLを生成
 */
export function createBillShareUrl(
  origin: string,
  billId: string,
  difficulty: DifficultyLevelEnum
): string {
  return `${origin}/bills/${billId}?difficulty=${difficulty}`;
}

/**
 * シェアメッセージを生成
 */
export function createShareMessage(bill: BillWithContent): string {
  const displayTitle = bill.bill_content?.title ?? bill.name;
  return `${displayTitle} #みらい議会`;
}

/**
 * シェアに必要なコンテキスト情報を取得
 */
export async function getShareContext(): Promise<{
  origin: string;
  difficulty: DifficultyLevelEnum;
}> {
  const [origin, difficulty] = await Promise.all([
    getOrigin(),
    getDifficultyLevel(),
  ]);

  return { origin, difficulty };
}

/**
 * 議案のシェアに必要なすべてのデータを取得
 */
export async function getBillShareData(bill: BillWithContent) {
  const { origin, difficulty } = await getShareContext();

  return {
    shareUrl: createBillShareUrl(origin, bill.id, difficulty),
    shareMessage: createShareMessage(bill),
    // シェア用OGP画像を優先的に使用、なければ通常のサムネイル
    thumbnailUrl: bill.share_thumbnail_url || bill.thumbnail_url,
  };
}
