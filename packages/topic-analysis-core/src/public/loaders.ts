import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import { countPublicReportsByBillId } from "@mirai-gikai/shared/report-publication/count-public-reports";
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
 *
 * 公開レポートが k-匿名性しきい値（`shouldDisplayPublicReports`＝20件）に満たない
 * 議案では、回答者個人が再識別され得るため空配列を返す。
 * web の他の公開レポート経路（getPublicReportsByBillId / getPublicReportById）と
 * 同じ判定を共有し、呼び出し側からは「公開回答なし」と同じ扱いになる。
 */
export async function getPublicBillRespondents(
  billId: string
): Promise<PublicRespondent[]> {
  // 件数ゲートを先に評価し、しきい値未満の議案では回答者データを取得しない。
  const publicReportCount = await countPublicReportsByBillId(billId);
  if (!shouldDisplayPublicReports(publicReportCount)) return [];
  const rows = await findPublicBillRespondentRows(billId);
  return buildPublicBillRespondents(rows);
}
