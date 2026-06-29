import "server-only";

import { buildPublicBillRespondents } from "./build-public-bill-respondents";
import { buildPublicRespondentDetail } from "./build-public-respondent-detail";
import { buildPublicTopicAnalysis } from "./build-public-topic-analysis";
import type {
  PublicRespondent,
  PublicRespondentDetail,
  PublicTopicAnalysis,
} from "./public-types";
import {
  findPublicBillRespondentRows,
  findPublicRespondentDetail,
  findPublishedAnalysis,
} from "./public-read-repository";

/**
 * 議案の公開中トピック分析を、§8 の表示時フィルタ適用後の表示用データで取得する。
 * 公開版が無ければ null（呼び出し側で「分析準備中」扱いにする）。
 *
 * web の Server Components / 公開 API と admin MCP が同一の PII セーフな経路を共有する。
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

/**
 * 公開レポート1件の詳細（立場説明＋会話ログ）を取得する。
 * 回答一覧と同一基準（管理者公開×ユーザー公開）でフィルタ。
 * 非公開・存在しない場合は null（呼び出し側で not_found 扱い）。
 */
export async function getPublicRespondentDetail(
  reportId: string
): Promise<PublicRespondentDetail | null> {
  const data = await findPublicRespondentDetail(reportId);
  if (!data) return null;
  return buildPublicRespondentDetail(data.report, data.messages);
}
