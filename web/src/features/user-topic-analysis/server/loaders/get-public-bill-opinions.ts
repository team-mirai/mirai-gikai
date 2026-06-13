import "server-only";

import type { PublicOpinion } from "../../shared/types";
import { buildPublicBillOpinions } from "../../shared/utils/build-public-bill-opinions";
import { findPublicBillOpinionRows } from "../repositories/topic-analysis-read-repository";

/**
 * 議案の公開意見を、トピック割当の有無に関わらず全件取得する。
 * AIインタビュー回答一覧（議案単位の意見一覧）で使用する。
 */
export async function getPublicBillOpinions(
  billId: string
): Promise<PublicOpinion[]> {
  const rows = await findPublicBillOpinionRows(billId);
  return buildPublicBillOpinions(rows);
}
