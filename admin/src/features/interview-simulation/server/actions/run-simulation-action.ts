"use server";

import { headers } from "next/headers";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { AiModel } from "@/lib/ai/models";
import { env } from "@/lib/env";
import type { SimulationResult } from "../../shared/types";

export interface RunSimulationActionParams {
  reportId: string;
  /** 元 config から復元した「現行プロンプト」全文 */
  currentSystemPrompt: string;
  /** ユーザーが編集した「改善版プロンプト」全文 */
  improvedSystemPrompt: string;
  /** 改善版で使う config ID（current と同じでも別でも可） */
  improvedConfigId: string;
  /** 改善版 sim のメトリクス用（選択した config の質問数） */
  improvedQuestionsCount: number;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  judgeModel: AiModel;
  /** false なら improved だけ実行（current は走らせない） */
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
