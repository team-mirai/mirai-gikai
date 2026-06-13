import "server-only";

import {
  buildPublicBillOpinions,
  type PublicBillOpinions,
} from "../../shared/utils/build-public-bill-opinions";
import { findPublicBillOpinionRows } from "../repositories/topic-analysis-read-repository";

/**
 * 議案の公開意見を、トピック割当の有無に関わらず全件取得する。
 * AIインタビュー回答一覧（議案単位の意見一覧）と、各ピルの回答者数で使用する。
 */
export async function getPublicBillOpinions(
  billId: string
): Promise<PublicBillOpinions> {
  const rows = await findPublicBillOpinionRows(billId);
  return buildPublicBillOpinions(rows);
}
