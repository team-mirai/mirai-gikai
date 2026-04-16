"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getReportDetailForSimulation } from "../loaders/get-report-detail-for-simulation";

export interface OriginalInterviewPreview {
  summary: string | null;
  stance: "for" | "against" | "neutral" | null;
  roleTitle: string | null;
  roleDescription: string | null;
  totalContentRichness: number | null;
  rating: number | null;
  opinions: Array<{
    title: string;
    content: string;
  }>;
  conversation: Array<{
    role: "interviewer" | "interviewee";
    content: string;
    quick_replies?: string[] | null;
  }>;
}

export type FetchOriginalInterviewPreviewResult =
  | { success: true; preview: OriginalInterviewPreview }
  | { success: false; error: string };

/**
 * シミュレーション実行前に元のインタビュー内容を確認するためのプレビューを取得する。
 * 会話ログ + レポート要約 + opinions を返す。
 */
export async function fetchOriginalInterviewPreview(
  reportId: string
): Promise<FetchOriginalInterviewPreviewResult> {
  await requireAdmin();

  try {
    const detail = await getReportDetailForSimulation(reportId);
    if (!detail) {
      return {
        success: false,
        error: "対象のレポートが見つかりません",
      };
    }
    const s = detail.snapshot;
    return {
      success: true,
      preview: {
        summary: s.summary,
        stance: s.stance,
        roleTitle: s.roleTitle,
        roleDescription: s.roleDescription,
        totalContentRichness: s.totalContentRichness,
        rating: s.rating,
        opinions: s.opinions.map((o) => ({
          title: o.title,
          content: o.content,
        })),
        conversation: s.conversation,
      },
    };
  } catch (error) {
    console.error("[Simulation] preview fetch failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "プレビューの取得に失敗しました",
    };
  }
}
