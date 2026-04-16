import type {
  PromptBillInput,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getReportDetailForSimulation } from "@/features/interview-simulation/server/loaders/get-report-detail-for-simulation";
import { runSimulationPipeline } from "@/features/interview-simulation/server/services/simulation-orchestrator";
import type {
  SimulationProgressEvent,
  SimulationRunRequest,
} from "@/features/interview-simulation/shared/types";
import { fetchBillWithContents } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
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

type PipelineParams = Parameters<typeof runSimulationPipeline>[0];
type BuildResult =
  | { ok: true; params: PipelineParams }
  | { ok: false; error: string; status: number };

function mapImprovedQuestions(
  params: SimulationRunRequest
): PromptInterviewQuestion[] {
  return params.improvedConfig.questions.map((q) => ({
    id: q.id,
    question: q.question,
    quick_replies: q.quick_replies ?? null,
    follow_up_guide: q.follow_up_guide ?? null,
  }));
}

/** SimulationRunRequest → pipeline params（report モード） */
async function buildPipelineParamsForReport(
  params: SimulationRunRequest,
  reportId: string
): Promise<BuildResult> {
  const detail = await getReportDetailForSimulation(reportId);
  if (!detail) {
    return {
      ok: false,
      error: "対象のレポートが見つかりません",
      status: 404,
    };
  }

  const improvedQuestions = mapImprovedQuestions(params);
  const billTitle =
    detail.bill?.bill_content?.title ?? detail.bill?.name ?? "この法案";

  return {
    ok: true,
    params: {
      personaSource: { type: "report", original: detail.snapshot },
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
    },
  };
}

/** SimulationRunRequest → pipeline params（bill モード = 自動生成ペルソナ） */
async function buildPipelineParamsForBill(
  params: SimulationRunRequest,
  source: {
    billId: string;
    stanceHint?: "for" | "against" | "neutral";
    roleHint?: string;
  }
): Promise<BuildResult> {
  const billData = await fetchBillWithContents(source.billId);
  if (!billData.bill) {
    return {
      ok: false,
      error: "対象の法案が見つかりません",
      status: 404,
    };
  }

  const bill: PromptBillInput = {
    name: billData.bill.name,
    bill_content: {
      title: billData.billTitle,
      summary: billData.billSummary,
      content: billData.billContent,
    },
  };

  const improvedQuestions = mapImprovedQuestions(params);
  const billTitle = billData.billTitle || billData.bill.name || "この法案";

  return {
    ok: true,
    params: {
      personaSource: {
        type: "bill",
        stanceHint: source.stanceHint,
        roleHint: source.roleHint,
      },
      billTitle,
      // bill モードでは「現行 config」の比較対象は存在しない
      currentPromptInputs: null,
      improvedPromptInputs: {
        bill,
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
      // bill モードでは常に false 扱い
      includeCurrent: false,
      evaluate: false,
    },
  };
}

function validateRequest(params: SimulationRunRequest): string | null {
  if (!params.personaSource) {
    return "personaSource is required";
  }
  if (
    params.personaSource.type === "report" &&
    !params.personaSource.reportId
  ) {
    return "personaSource.reportId is required";
  }
  if (params.personaSource.type === "bill" && !params.personaSource.billId) {
    return "personaSource.billId is required";
  }
  if (!params.improvedConfig) {
    return "improvedConfig is required";
  }
  if (
    !Array.isArray(params.improvedConfig.questions) ||
    params.improvedConfig.questions.length === 0
  ) {
    return "改善版 config に質問が 1 件以上必要です";
  }
  return null;
}

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  let params: SimulationRunRequest;
  try {
    params = (await request.json()) as SimulationRunRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateRequest(params);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const built: BuildResult =
    params.personaSource.type === "report"
      ? await buildPipelineParamsForReport(
          params,
          params.personaSource.reportId
        )
      : await buildPipelineParamsForBill(params, {
          billId: params.personaSource.billId,
          stanceHint: params.personaSource.stanceHint,
          roleHint: params.personaSource.roleHint,
        });

  if (!built.ok) {
    return Response.json({ error: built.error }, { status: built.status });
  }

  const pipelineParams = built.params;
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
