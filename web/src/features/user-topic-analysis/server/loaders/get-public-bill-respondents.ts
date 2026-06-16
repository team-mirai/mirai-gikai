import "server-only";

import type { PublicRespondent } from "../../shared/types";
import { buildPublicBillRespondents } from "../../shared/utils/build-public-bill-respondents";
import { findPublicBillRespondentRows } from "../repositories/topic-analysis-read-repository";

/**
 * 議案の公開レポート（回答者）を全件取得する。
 * AIインタビュー回答一覧（回答者1人=1カード）で使用する。
 */
export async function getPublicBillRespondents(
  billId: string
): Promise<PublicRespondent[]> {
  const rows = await findPublicBillRespondentRows(billId);
  return buildPublicBillRespondents(rows);
}
