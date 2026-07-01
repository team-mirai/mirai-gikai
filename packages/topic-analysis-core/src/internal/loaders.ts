import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import { countPublicReportsByBillId } from "@mirai-gikai/shared/report-publication/count-public-reports";
import { buildPublicBillRespondents } from "../public/build-public-bill-respondents";
import { buildPublicRespondentDetail } from "../public/build-public-respondent-detail";
import { buildPublicTopicAnalysis } from "../public/build-public-topic-analysis";
import {
  findLatestAnalysis,
  findRespondentDetail,
  findRespondentRows,
  type ModerationStatus,
  type ReportRowFilter,
  type RespondentDetailFilter,
} from "../public/public-read-repository";
import type {
  PublicRespondent,
  PublicRespondentDetail,
  PublicTopicAnalysis,
  RawOpinionRow,
} from "../public/public-types";

/**
 * 内部用途（admin MCP）の取得条件。**未指定の項目は制約しない**（＝全件対象）。
 * デフォルト（空）では公開・非公開・モデレーション状態を問わず全件返す。
 * プロンプト等から条件を指定したときのみ、その条件でクエリを絞り込む。
 *
 * 注意: これは「公開（PII セーフ）」経路ではない。web 公開ページは別途
 * `getPublicTopicAnalysis` / `getPublicBillRespondents`（§8 固定）を使う。
 * ただし本経路でも user_id・email・有識者登録情報等の直接識別子は返却型に含めない。
 */
export type ReadFilter = {
  isPublicByAdmin?: boolean;
  isPublicByUser?: boolean;
  moderationStatus?: ModerationStatus;
  /** true のとき web と同じ k-匿名性ゲート（公開レポート >= 20 件）を適用。 */
  requireDisplayThreshold?: boolean;
};

/** ReadFilter から、トピック分析の意見述語を組み立てる（未指定なら全件通す）。 */
function opinionPredicate(filter: ReadFilter): (o: RawOpinionRow) => boolean {
  return (o) => {
    if (
      filter.isPublicByAdmin !== undefined &&
      o.is_public_by_admin !== filter.isPublicByAdmin
    ) {
      return false;
    }
    if (
      filter.isPublicByUser !== undefined &&
      o.is_public_by_user !== filter.isPublicByUser
    ) {
      return false;
    }
    if (
      filter.moderationStatus !== undefined &&
      o.moderation_status !== filter.moderationStatus
    ) {
      return false;
    }
    return true;
  };
}

/** requireDisplayThreshold 指定時、公開レポートが k-匿名性しきい値未満なら true（＝隠す）。 */
async function blockedByThreshold(
  billId: string,
  filter: ReadFilter
): Promise<boolean> {
  if (!filter.requireDisplayThreshold) return false;
  const count = await countPublicReportsByBillId(billId);
  return !shouldDisplayPublicReports(count);
}

/**
 * 議案の最新トピック分析を取得する（公開・非公開を問わず最新版）。
 * filter で意見を絞り込み、件数・内訳・期待/懸念はフィルタ後の集合から再計算する。
 * version が無い／件数ゲートで隠す場合は null。
 */
export async function getTopicAnalysis(
  billId: string,
  filter: ReadFilter = {}
): Promise<PublicTopicAnalysis | null> {
  if (await blockedByThreshold(billId, filter)) return null;
  const data = await findLatestAnalysis(billId);
  if (!data) return null;
  return buildPublicTopicAnalysis(
    data.meta,
    data.rawTopics,
    opinionPredicate(filter)
  );
}

/**
 * 議案の回答者一覧を取得する（回答者1人=1件、新しい順）。
 * filter 未指定なら公開・非公開を問わず全件。件数ゲートで隠す場合は null。
 */
export async function listRespondents(
  billId: string,
  filter: ReadFilter = {}
): Promise<PublicRespondent[] | null> {
  if (await blockedByThreshold(billId, filter)) return null;
  const rowFilter: ReportRowFilter = {
    isPublicByAdmin: filter.isPublicByAdmin,
    isPublicByUser: filter.isPublicByUser,
    moderationStatus: filter.moderationStatus,
  };
  const rows = await findRespondentRows(billId, rowFilter);
  return buildPublicBillRespondents(rows);
}

/**
 * レポート1件の詳細（立場説明＋会話ログ）を取得する。
 * filter で公開フラグ・モデレーション・件数ゲート（requireDisplayThreshold）を任意に適用。
 * 条件に合致しない／存在しない場合は null（呼び出し側で not_found 扱い）。
 */
export async function getRespondentDetail(
  reportId: string,
  filter: ReadFilter = {}
): Promise<PublicRespondentDetail | null> {
  const detailFilter: RespondentDetailFilter = {
    isPublicByAdmin: filter.isPublicByAdmin,
    isPublicByUser: filter.isPublicByUser,
    moderationStatus: filter.moderationStatus,
    requireDisplayThreshold: filter.requireDisplayThreshold,
  };
  const data = await findRespondentDetail(reportId, detailFilter);
  if (!data) return null;
  return buildPublicRespondentDetail(data.report, data.messages);
}
