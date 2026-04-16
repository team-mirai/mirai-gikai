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
import { generatePersonaFromBill } from "./generate-persona-from-bill";
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

/**
 * ペルソナ生成ソース（orchestrator 内部用の正規化済み表現）
 * - report: 過去レポートから抽出（元会話を style anchors / Judge baseline として使う）
 * - bill: 法案内容から LLM 生成（元会話なし、Judge 無効）
 */
type PersonaSource =
  | { type: "report"; original: OriginalInterviewSnapshot }
  | {
      type: "bill";
      stanceHint?: "for" | "against" | "neutral";
      roleHint?: string;
    };

interface RunSimulationParams {
  /** ペルソナ生成ソース */
  personaSource: PersonaSource;
  /** 現行（保存済み config）の sim 素材。bill モード時は未使用 */
  currentPromptInputs: SimulationPromptInputs | null;
  /** 改善版（編集中 config）の sim 素材 */
  improvedPromptInputs: SimulationPromptInputs;
  /** 初回ターン enhanced prompt で使う billTitle（本番 generateInitialQuestion 相当） */
  billTitle: string;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  judgeModel: AiModel;
  /** bill モードでは無視＝常に false 扱い */
  includeCurrent: boolean;
  /** bill モードでは無視＝常に false 扱い */
  evaluate: boolean;
  /** ストリーミング進捗コールバック。省略時は進捗を送信しない */
  onProgress?: (event: SimulationProgressEvent) => void;
  /**
   * 中断シグナル（request.signal 等）。
   * クライアントが fetch を abort した場合にサーバー側の LLM 呼び出しも
   * 停止させ、課金とレイテンシの無駄を防ぐため pipeline 末端まで伝播させる。
   */
  signal?: AbortSignal;
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

  const sourceLabel =
    params.personaSource.type === "report"
      ? `reportId=${params.personaSource.original.reportId}`
      : `billMode stance=${params.personaSource.stanceHint ?? "auto"}`;
  console.log(
    `[Simulation] start traceId=${traceId} ${sourceLabel} includeCurrent=${params.includeCurrent} evaluate=${params.evaluate}`
  );

  const emit = params.onProgress;

  // --- ペルソナ生成（source により分岐） ---
  emit?.({ type: "status", message: "ペルソナ生成中..." });
  const persona =
    params.personaSource.type === "report"
      ? await generatePersona({
          original: params.personaSource.original,
          model: params.personaModel,
          traceId,
          signal: params.signal,
        })
      : await generatePersonaFromBill({
          bill: params.improvedPromptInputs.bill,
          interviewConfig: params.improvedPromptInputs.interviewConfig,
          stanceHint: params.personaSource.stanceHint,
          roleHint: params.personaSource.roleHint,
          model: params.personaModel,
          traceId,
          signal: params.signal,
        });

  // --- style anchors（report モード時のみ、元会話から抽出） ---
  const styleAnchors =
    params.personaSource.type === "report"
      ? extractOriginalStyleAnchors(params.personaSource.original.conversation)
      : undefined;

  // bill モードでは includeCurrent / evaluate を無効化（比較対象なし）
  const effectiveIncludeCurrent =
    params.personaSource.type === "report" && params.includeCurrent;
  const effectiveEvaluate =
    params.personaSource.type === "report" && params.evaluate;

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
      signal: params.signal,
    }),
  ];

  if (effectiveIncludeCurrent && params.currentPromptInputs) {
    const currentInputs = params.currentPromptInputs;
    simPromises.push(
      runSimulatedInterview({
        persona,
        interviewerModel: params.interviewerModel,
        intervieweeModel: params.intervieweeModel,
        traceId,
        kind: PROMPT_KIND.current,
        styleAnchors,
        promptInputs: {
          bill: currentInputs.bill,
          interviewConfig: currentInputs.interviewConfig,
          questions: currentInputs.questions,
          mode: currentInputs.mode,
        },
        initialTurnEnhancement: {
          billTitle: params.billTitle,
          firstQuestionId: currentInputs.questions[0]?.id ?? null,
        },
        estimatedDurationMinutes: currentInputs.estimatedDurationMinutes,
        signal: params.signal,
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

  // 改善版 sim vs 元の実インタビュー（report モード時のみ）
  if (
    effectiveEvaluate &&
    improvedSim &&
    params.personaSource.type === "report" &&
    params.personaSource.original.conversation.length > 0
  ) {
    emit?.({ type: "status", message: "AI Judge 評価中..." });
    try {
      evaluationVsOriginal = await runAiJudgeVsOriginal({
        original: params.personaSource.original,
        improvedSimulation: {
          interviewerSystemPrompt: improvedSim.interviewerSystemPrompt,
          transcript: improvedSim.transcript,
          stopReason: improvedSim.stopReason,
          askedPredefinedCount: improvedSim.metrics.askedQuestionIds.length,
          totalPredefinedCount: params.improvedPromptInputs.questions.length,
        },
        model: params.judgeModel,
        traceId,
        signal: params.signal,
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
    original:
      params.personaSource.type === "report"
        ? params.personaSource.original
        : null,
    simulations,
    evaluationVsOriginal,
    totalElapsedMs,
  };
}
