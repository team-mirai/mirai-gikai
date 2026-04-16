import "server-only";

import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import {
  type JudgeVsOriginalVerdict,
  judgeVsOriginalVerdictSchema,
  type SimulatedTurn,
} from "../../shared/schemas";
import type { OriginalInterviewSnapshot } from "../../shared/types";
import { buildJudgeVsOriginalPrompt } from "../../shared/utils/build-judge-vs-original-prompt";

interface RunAiJudgeVsOriginalParams {
  original: OriginalInterviewSnapshot;
  improvedSimulation: {
    interviewerSystemPrompt: string;
    transcript: SimulatedTurn[];
    stopReason:
      | "max_turns"
      | "summary"
      | "summary_complete"
      | "interviewer_error"
      | "interviewee_error";
    askedPredefinedCount: number;
    totalPredefinedCount: number;
  };
  model: AiModel;
  traceId: string;
  /** クライアント abort 時に LLM 呼び出しも停止させる */
  signal?: AbortSignal;
}

/**
 * 改善版プロンプト sim のインタビュアーと、元の実インタビューのインタビュアーを
 * 比較評価する。どの点で良く/悪く/変わらないかを要約して返す。
 */
export async function runAiJudgeVsOriginal({
  original,
  improvedSimulation,
  model,
  traceId,
  signal,
}: RunAiJudgeVsOriginalParams): Promise<JudgeVsOriginalVerdict> {
  const prompt = buildJudgeVsOriginalPrompt({
    original,
    improvedSimulation,
  });

  const { object } = await generateObject({
    model,
    schema: judgeVsOriginalVerdictSchema,
    prompt,
    abortSignal: signal,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "sim-judge-vs-original",
      metadata: {
        traceId,
        reportId: original.reportId,
      },
    },
  });

  return object;
}
