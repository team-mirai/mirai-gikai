import type {
  PromptBillInput,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getReportDetailForSimulation } from "@/features/interview-simulation/server/loaders/get-report-detail-for-simulation";
import { runSimulationPipeline } from "@/features/interview-simulation/server/services/simulation-orchestrator";
import { simulationRunRequestSchema } from "@/features/interview-simulation/shared/schemas";
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

export async function POST(request: Request) {
  const authError = await authenticate(request);
  if (authError) return authError;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // zod で実行時バリデーション: personaSource.type や mode などの enum、
  // 質問要素の必須フィールドまで含めて不正 payload を 400 で弾く
  const parsed = simulationRunRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") ?? "";
    return Response.json(
      {
        error: firstIssue
          ? `リクエストが不正です (${path}: ${firstIssue.message})`
          : "リクエストが不正です",
      },
      { status: 400 }
    );
  }
  const params: SimulationRunRequest = parsed.data;

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
          // クライアントが fetch を abort したら pipeline 全体にも伝播させる
          const result = await runSimulationPipeline({
            ...pipelineParams,
            onProgress: emit,
            signal: request.signal,
          });
          emit({ type: "complete", result });
        } catch (error) {
          if (request.signal.aborted) {
            console.log("[Simulation] aborted by client");
          } else {
            console.error("[Simulation] pipeline failed:", error);
            emit({
              type: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "シミュレーションに失敗しました",
            });
          }
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
    const result = await runSimulationPipeline({
      ...pipelineParams,
      signal: request.signal,
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
