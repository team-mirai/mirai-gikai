import "server-only";

import { shouldDisplayPublicReports } from "@mirai-gikai/shared/report-publication/auto-publish";
import { cache } from "react";
import type { InterviewReport } from "../../shared/types";
import {
  countUserMessageCharacters,
  getBillIdFromPublicReportSession,
  selectPrimaryBillContent,
} from "../../shared/utils/public-report-display";
import {
  countPublicReportsByBillId,
  findBillWithContentById,
  findMessagesBySessionId,
  findPublicReportWithSessionById,
} from "../repositories/interview-report-repository";

export type PublicReportData = InterviewReport & {
  bill_id: string;
  session_started_at: string;
  session_completed_at: string | null;
  bill: {
    id: string;
    name: string;
    thumbnail_url: string | null;
    share_thumbnail_url: string | null;
    bill_content: { title: string } | null;
  };
  characterCount: number;
};

/**
 * 公開レポートをIDから取得（認証不要）
 * 公開条件: is_public_by_admin = true AND is_public_by_user = true
 * React cache()でリクエスト内のDB呼び出しを重複排除
 */
export const getPublicReportById = cache(
  async (reportId: string): Promise<PublicReportData | null> => {
    let report: Awaited<ReturnType<typeof findPublicReportWithSessionById>>;
    try {
      report = await findPublicReportWithSessionById(reportId);
    } catch (error) {
      // レポートが見つからない場合（PGRST116: single row not found）はnullを返す
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("PGRST116") || message.includes("not found")) {
        return null;
      }
      // それ以外のエラー（インフラ障害等）は再throwする
      throw error;
    }

    const session = report.interview_sessions as {
      started_at: string;
      completed_at: string | null;
      interview_configs: { bill_id: string } | null;
    } | null;

    if (!session) {
      return null;
    }

    const billId = getBillIdFromPublicReportSession(session);
    if (!billId) {
      return null;
    }

    let publicReportCount: number;
    try {
      publicReportCount = await countPublicReportsByBillId(billId);
    } catch (error) {
      console.error("Failed to count public reports:", error);
      return null;
    }
    if (!shouldDisplayPublicReports(publicReportCount)) {
      return null;
    }

    const [bill, messages] = await Promise.all([
      findBillWithContentById(billId),
      findMessagesBySessionId(report.interview_session_id),
    ]);

    const { interview_sessions: _, ...reportData } = report;

    return {
      ...reportData,
      bill_id: billId,
      session_started_at: session.started_at,
      session_completed_at: session.completed_at,
      bill: {
        id: bill.id,
        name: bill.name,
        thumbnail_url: bill.thumbnail_url,
        share_thumbnail_url: bill.share_thumbnail_url,
        bill_content: selectPrimaryBillContent(bill.bill_contents),
      },
      characterCount: countUserMessageCharacters(messages),
    };
  }
);
