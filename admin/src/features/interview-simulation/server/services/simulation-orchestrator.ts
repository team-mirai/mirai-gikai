import "server-only";

import { randomUUID } from "node:crypto";
import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
import type { AiModel } from "@/lib/ai/models";
import { registerNodeTelemetry } from "@/lib/telemetry/register";
import { PROMPT_KIND } from "../../shared/constants";
import type { JudgeVsOriginalVerdict } from "../../shared/schemas";
import type {
  OriginalInterviewSnapshot,
  SimulationProgressEvent,
  SimulationResult,
  SimulationRun,
} from "../../shared/types";
import { extractOriginalStyleAnchors } from "../../shared/utils/extract-original-style-anchors";
import { generatePersona } from "./generate-persona";
import { runAiJudgeVsOriginal } from "./run-ai-judge-vs-original";
import { runSimulatedInterview } from "./run-simulated-interview";

/** 1 sim 分のプロンプト素材。本番と同じ builder を毎ターン呼ぶために渡す */
interface SimulationPromptInputs {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  questions: PromptInterviewQuestion[];
  mode: "loop" | "bulk";
  estimatedDurationMinutes: number | null;
}

interface RunSimulationParams {
  original: OriginalInterviewSnapshot;
  /** 現行（保存済み config）の sim 素材 */
  currentPromptInputs: SimulationPromptInputs;
  /** 改善版（編集中 config）の sim 素材 */
  improvedPromptInputs: SimulationPromptInputs;
  /** 初回ターン enhanced prompt で使う billTitle（本番 generateInitialQuestion 相当） */
  billTitle: string;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  judgeModel: AiModel;
  includeCurrent: boolean;
  evaluate: boolean;
  /** ストリーミング進捗コールバック。省略時は進捗を送信しない */
  onProgress?: (event: SimulationProgressEvent) => void;
}

/**
 * シミュレーション全体を 1 回実行するエントリポイント。
 * 1. ペルソナ抽出
 * 2. improved (必須) / current (任意) を並列で sim
 * 3. evaluate=true && includeCurrent=true なら Judge を 1 回呼ぶ
 */
export async function runSimulationPipeline(
  params: RunSimulationParams
): Promise<SimulationResult> {
  await registerNodeTelemetry();

  const startedAt = Date.now();
  const traceId = randomUUID();

  console.log(
    `[Simulation] start traceId=${traceId} reportId=${params.original.reportId} includeCurrent=${params.includeCurrent} evaluate=${params.evaluate}`
  );

  const emit = params.onProgress;

  emit?.({ type: "status", message: "ペルソナ抽出中..." });
  const persona = await generatePersona({
    original: params.original,
    model: params.personaModel,
    traceId,
  });

  // 元インタビューの実測文字数 + サンプル発話を抽出して、
  // インタビュイー LLM の回答長を元会話レンジに寄せる
  const styleAnchors = extractOriginalStyleAnchors(
    params.original.conversation
  );

  emit?.({ type: "status", message: "改善版シミュレーション実行中..." });
  const simPromises: Array<Promise<SimulationRun>> = [
    runSimulatedInterview({
      persona,
      interviewerModel: params.interviewerModel,
      intervieweeModel: params.intervieweeModel,
      traceId,
      kind: PROMPT_KIND.improved,
      styleAnchors,
      promptInputs: {
        bill: params.improvedPromptInputs.bill,
        interviewConfig: params.improvedPromptInputs.interviewConfig,
        questions: params.improvedPromptInputs.questions,
        mode: params.improvedPromptInputs.mode,
      },
      initialTurnEnhancement: {
        billTitle: params.billTitle,
        firstQuestionId: params.improvedPromptInputs.questions[0]?.id ?? null,
      },
      estimatedDurationMinutes:
        params.improvedPromptInputs.estimatedDurationMinutes,
      onTurnComplete: emit
        ? (turnIndex, turn) => emit({ type: "turn", turnIndex, turn })
        : undefined,
    }),
  ];

  if (params.includeCurrent) {
    simPromises.push(
      runSimulatedInterview({
        persona,
        interviewerModel: params.interviewerModel,
        intervieweeModel: params.intervieweeModel,
        traceId,
        kind: PROMPT_KIND.current,
        styleAnchors,
        promptInputs: {
          bill: params.currentPromptInputs.bill,
          interviewConfig: params.currentPromptInputs.interviewConfig,
          questions: params.currentPromptInputs.questions,
          mode: params.currentPromptInputs.mode,
        },
        initialTurnEnhancement: {
          billTitle: params.billTitle,
          firstQuestionId: params.currentPromptInputs.questions[0]?.id ?? null,
        },
        estimatedDurationMinutes:
          params.currentPromptInputs.estimatedDurationMinutes,
      })
    );
  }

  const sims = await Promise.all(simPromises);
  const simulations: SimulationResult["simulations"] = {};
  for (const sim of sims) {
    simulations[sim.promptKind] = sim;
  }

  let evaluationVsOriginal: JudgeVsOriginalVerdict | null = null;
  let judgeModelUsed: AiModel | null = null;
  const improvedSim = simulations[PROMPT_KIND.improved];

  // 改善版 sim vs 元の実インタビュー（唯一の Judge）
  if (
    params.evaluate &&
    improvedSim &&
    params.original.conversation.length > 0
  ) {
    emit?.({ type: "status", message: "AI Judge 評価中..." });
    try {
      evaluationVsOriginal = await runAiJudgeVsOriginal({
        original: params.original,
        improvedSimulation: {
          interviewerSystemPrompt: improvedSim.interviewerSystemPrompt,
          transcript: improvedSim.transcript,
          stopReason: improvedSim.stopReason,
          askedPredefinedCount: improvedSim.metrics.askedQuestionIds.length,
          totalPredefinedCount: params.improvedPromptInputs.questions.length,
        },
        model: params.judgeModel,
        traceId,
      });
      judgeModelUsed = params.judgeModel;
    } catch (error) {
      console.error("[Simulation] AI Judge vs original failed:", error);
    }
  }

  const totalElapsedMs = Date.now() - startedAt;
  console.log(
    `[Simulation] done traceId=${traceId} elapsedMs=${totalElapsedMs}`
  );

  return {
    persona,
    personaModel: params.personaModel,
    judgeModel: judgeModelUsed,
    original: params.original,
    simulations,
    evaluationVsOriginal,
    totalElapsedMs,
  };
}
