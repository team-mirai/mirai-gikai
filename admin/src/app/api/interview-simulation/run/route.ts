import type { InterviewQuestion as PromptInterviewQuestion } from "@mirai-gikai/shared/interview-prompts/types";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import type { RunSimulationActionParams } from "@/features/interview-simulation/server/actions/run-simulation-action";
import { getReportDetailForSimulation } from "@/features/interview-simulation/server/loaders/get-report-detail-for-simulation";
import { runSimulationPipeline } from "@/features/interview-simulation/server/services/simulation-orchestrator";
import type { SimulationProgressEvent } from "@/features/interview-simulation/shared/types";
import { verifyInternalAuth } from "@/features/topic-analysis/server/utils/trigger-next-phase";

export const maxDuration = 300;

/**
 * 認証: Bearer トークン（Server Action 経由の内部呼び出し）または
 * Cookie セッション（クライアント直接呼び出し）のいずれかを受け付ける。
 */
async function authenticate(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      verifyInternalAuth(request);
      return null;
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    await requireAdmin();
    return null;
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function buildPipelineParams(
  params: RunSimulationActionParams,
  detail: NonNullable<Awaited<ReturnType<typeof getReportDetailForSimulation>>>
) {
  const improvedQuestions: PromptInterviewQuestion[] =
    params.improvedConfig.questions.map((q) => ({
      id: q.id,
      question: q.question,
      quick_replies: q.quick_replies ?? null,
      follow_up_guide: q.follow_up_guide ?? null,
    }));

  const billTitle =
    detail.bill?.bill_content?.title ?? detail.bill?.name ?? "この法案";

  return {
    original: detail.snapshot,
    billTitle,
    currentPromptInputs: {
      bill: detail.bill,
      interviewConfig: detail.interviewConfig,
      questions: detail.questions,
      mode: detail.mode,
      estimatedDurationMinutes: detail.estimatedDurationMinutes,
    },
    improvedPromptInputs: {
      bill: detail.bill,
      interviewConfig: {
        themes: params.improvedConfig.themes,
        knowledge_source: params.improvedConfig.knowledgeSource,
      },
      questions: improvedQuestions,
      mode: params.improvedConfig.mode,
      estimatedDurationMinutes:
        params.improvedConfig.estimatedDurationMinutes ?? null,
    },
    interviewerModel: params.interviewerModel,
    intervieweeModel: params.intervieweeModel,
    personaModel: params.personaModel,
    judgeModel: params.judgeModel,
    includeCurrent: params.includeCurrent,
    evaluate: params.evaluate,
  } as const;
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  let params: RunSimulationActionParams;
  try {
    params = (await request.json()) as RunSimulationActionParams;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!params.reportId) {
    return Response.json({ error: "reportId is required" }, { status: 400 });
  }
  if (!params.improvedConfig) {
    return Response.json(
      { error: "improvedConfig is required" },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(params.improvedConfig.questions) ||
    params.improvedConfig.questions.length === 0
  ) {
    return Response.json(
      { error: "改善版 config に質問が 1 件以上必要です" },
      { status: 400 }
    );
  }

  const detail = await getReportDetailForSimulation(params.reportId);
  if (!detail) {
    return Response.json(
      { error: "対象のレポートが見つかりません" },
      { status: 404 }
    );
  }

  const pipelineParams = buildPipelineParams(params, detail);
  const wantsStream = request.headers.get("Accept") === "application/x-ndjson";

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: SimulationProgressEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };
        try {
          const result = await runSimulationPipeline({
            ...pipelineParams,
            onProgress: emit,
          });
          emit({ type: "complete", result });
        } catch (error) {
          console.error("[Simulation] pipeline failed:", error);
          emit({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "シミュレーションに失敗しました",
          });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  try {
    const result = await runSimulationPipeline(pipelineParams);
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
