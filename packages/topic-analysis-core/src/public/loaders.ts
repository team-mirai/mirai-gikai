import "server-only";

import { buildPublicBillRespondents } from "./build-public-bill-respondents";
import { buildPublicTopicAnalysis } from "./build-public-topic-analysis";
import type { PublicRespondent, PublicTopicAnalysis } from "./public-types";
import {
  findPublicBillRespondentRows,
  findPublishedAnalysis,
} from "./public-read-repository";

/**
 * 議案の公開中トピック分析を、§8 の表示時フィルタ適用後の表示用データで取得する。
 * 公開版が無ければ null（呼び出し側で「分析準備中」扱いにする）。
 *
 * web の Server Components / 公開 API が使用する公開（PII セーフ）経路。
 */
export async function getPublicTopicAnalysis(
  billId: string
): Promise<PublicTopicAnalysis | null> {
  const data = await findPublishedAnalysis(billId);
  if (!data) return null;
  return buildPublicTopicAnalysis(data.meta, data.rawTopics);
}

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
