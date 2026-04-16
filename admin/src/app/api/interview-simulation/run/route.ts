import {
  findInterviewConfigById,
  findInterviewQuestionsByConfigId,
} from "@/features/interview-config/server/repositories/interview-config-repository";
import type { RunSimulationActionParams } from "@/features/interview-simulation/server/actions/run-simulation-action";
import { getReportDetailForSimulation } from "@/features/interview-simulation/server/loaders/get-report-detail-for-simulation";
import { runSimulationPipeline } from "@/features/interview-simulation/server/services/simulation-orchestrator";
import { verifyInternalAuth } from "@/features/topic-analysis/server/utils/trigger-next-phase";

export const maxDuration = 120;

export async function POST(request: Request) {
  // Server Action から内部 fetch される。middleware でログインリダイレクトされないよう、
  // Bearer Token (REVALIDATE_SECRET) で認証する。Server Action 側で requireAdmin 済み。
  try {
    verifyInternalAuth(request);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let params: RunSimulationActionParams;
  try {
    params = (await request.json()) as RunSimulationActionParams;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!params.reportId) {
    return Response.json({ error: "reportId is required" }, { status: 400 });
  }
  if (!params.improvedSystemPrompt) {
    return Response.json(
      { error: "improvedSystemPrompt is required" },
      { status: 400 }
    );
  }

  try {
    const detail = await getReportDetailForSimulation(params.reportId);
    if (!detail) {
      return Response.json(
        { error: "対象のレポートが見つかりません" },
        { status: 404 }
      );
    }

    // 改善版が別 config を選択している場合、その config の themes/knowledge_source と
    // questions/mode を Summary プロンプト・毎ターン進捗更新用にロードする
    let improvedInterviewConfig = detail.interviewConfig;
    let improvedQuestionsForStage = detail.questions;
    let improvedMode: "loop" | "bulk" = detail.mode;
    let improvedFirstQuestionId: string | null =
      detail.questions[0]?.id ?? null;
    if (params.improvedConfigId !== detail.snapshot.configId) {
      const [improvedConfigRow, improvedQuestions] = await Promise.all([
        findInterviewConfigById(params.improvedConfigId),
        findInterviewQuestionsByConfigId(params.improvedConfigId),
      ]);
      if (improvedConfigRow) {
        improvedInterviewConfig = {
          themes: improvedConfigRow.themes ?? null,
          knowledge_source: improvedConfigRow.knowledge_source ?? null,
        };
        improvedMode = improvedConfigRow.mode === "bulk" ? "bulk" : "loop";
      }
      improvedFirstQuestionId = improvedQuestions[0]?.id ?? null;
      improvedQuestionsForStage = improvedQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        quick_replies: q.quick_replies ?? null,
        follow_up_guide: q.follow_up_guide ?? null,
      }));
    }

    // 本番 generateInitialQuestion と同じ billTitle を構築（fallback は bill.name）
    const billTitle =
      detail.bill?.bill_content?.title ?? detail.bill?.name ?? "この法案";

    const result = await runSimulationPipeline({
      original: detail.snapshot,
      currentQuestionsCount: detail.questions.length,
      improvedQuestionsCount: params.improvedQuestionsCount,
      currentSystemPrompt: params.currentSystemPrompt,
      improvedSystemPrompt: params.improvedSystemPrompt,
      bill: detail.bill,
      currentInterviewConfig: detail.interviewConfig,
      improvedInterviewConfig,
      billTitle,
      currentFirstQuestionId: detail.questions[0]?.id ?? null,
      improvedFirstQuestionId,
      currentQuestions: detail.questions,
      improvedQuestions: improvedQuestionsForStage,
      currentMode: detail.mode,
      improvedMode,
      interviewerModel: params.interviewerModel,
      intervieweeModel: params.intervieweeModel,
      personaModel: params.personaModel,
      judgeModel: params.judgeModel,
      includeCurrent: params.includeCurrent,
      evaluate: params.evaluate,
    });

    return Response.json({ success: true, result });
  } catch (error) {
    console.error("[Simulation] pipeline failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "シミュレーションに失敗しました",
      },
      { status: 500 }
    );
  }
}
