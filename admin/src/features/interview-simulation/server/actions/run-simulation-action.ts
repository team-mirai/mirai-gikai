"use server";

import { headers } from "next/headers";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { AiModel } from "@/lib/ai/models";
import { env } from "@/lib/env";
import type { SimulationResult } from "../../shared/types";

/**
 * UI フォームから送る「編集中（未保存を含む）の config スナップショット」。
 * 改善版 sim はこの値を使って system prompt を毎ターン構築する。
 * 本番の「編集した config を保存せずにテストする」ユースケース向け。
 */
export interface TransientConfigSnapshot {
  mode: "loop" | "bulk";
  themes: string[] | null;
  knowledgeSource: string | null;
  /** インタビュー目安時間（分）。本番の「## タイムマネジメント」セクションに反映される */
  estimatedDurationMinutes: number | null;
  questions: Array<{
    /** 既存質問ならその id、未保存の新規質問ならクライアント側の一時 UUID */
    id: string;
    question: string;
    quick_replies: string[] | null;
    follow_up_guide: string | null;
  }>;
}

export interface RunSimulationActionParams {
  /** どのレポート（過去の完了インタビュー）をペルソナ抽出元として使うか */
  reportId: string;
  /** 改善版 = UI で編集中の config スナップショット（未保存を含む） */
  improvedConfig: TransientConfigSnapshot;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  judgeModel: AiModel;
  /** false なら improved だけ実行。true なら「保存済み config」と並列 sim + Judge で比較 */
  includeCurrent: boolean;
  /** false なら Judge を回さない */
  evaluate: boolean;
}

export type RunSimulationActionResult =
  | { success: true; result: SimulationResult }
  | { success: false; error: string };

/**
 * シミュレーション 1 回分の同期 Server Action。
 * API Route 経由で実行することで maxDuration: 120 秒を確保する。
 */
export async function runSimulationAction(
  params: RunSimulationActionParams
): Promise<RunSimulationActionResult> {
  await requireAdmin();

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return {
      success: false,
      error:
        "REVALIDATE_SECRET が設定されていません（内部 API 呼び出しに必要）",
    };
  }

  // middleware が未認証リクエストを /login へ 302 リダイレクトするため、
  // ユーザーの Cookie を内部 fetch にも転送する。
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";

  try {
    const response = await fetch(
      `${env.adminUrl}/api/interview-simulation/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
          Cookie: cookieHeader,
        },
        body: JSON.stringify(params),
        cache: "no-store",
      }
    );

    const data = (await response.json()) as
      | { success: true; result: SimulationResult }
      | { success?: false; error: string };

    if (!response.ok || !("result" in data)) {
      return {
        success: false,
        error:
          ("error" in data && data.error) ||
          `シミュレーション API がエラー応答 (status ${response.status})`,
      };
    }

    return { success: true, result: data.result };
  } catch (error) {
    console.error("[Simulation] Server Action failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "シミュレーションの実行に失敗しました",
    };
  }
}
