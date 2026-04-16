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
import type {
  JudgeVerdict,
  JudgeVsOriginalVerdict,
} from "../../shared/schemas";
import type {
  OriginalInterviewSnapshot,
  SimulationResult,
  SimulationRun,
} from "../../shared/types";
import { extractOriginalStyleAnchors } from "../../shared/utils/extract-original-style-anchors";
import { generatePersona } from "./generate-persona";
import { runAiJudge } from "./run-ai-judge";
import { runAiJudgeVsOriginal } from "./run-ai-judge-vs-original";
import { runSimulatedInterview } from "./run-simulated-interview";

interface RunSimulationParams {
  original: OriginalInterviewSnapshot;
  /** current sim で使う質問数（元レポートの config） */
  currentQuestionsCount: number;
  /** improved sim で使う質問数（ユーザーが選択した config。current と違うことがある） */
  improvedQuestionsCount: number;
  currentSystemPrompt: string;
  improvedSystemPrompt: string;
  /** Summary フェーズ用の共通 bill */
  bill: PromptBillInput;
  /** 現行 sim の Summary フェーズで使う config（元レポートの config に合わせる） */
  currentInterviewConfig: PromptInterviewConfig;
  /** 改善版 sim の Summary フェーズで使う config（ユーザー選択の config） */
  improvedInterviewConfig: PromptInterviewConfig;
  /** 初回ターン enhanced prompt で使う billTitle（本番 generateInitialQuestion 相当） */
  billTitle: string;
  /** 現行 sim の最初の事前定義質問 ID */
  currentFirstQuestionId: string | null;
  /** 改善版 sim の最初の事前定義質問 ID */
  improvedFirstQuestionId: string | null;
  /** 現行 sim の事前定義質問一覧（毎ターン進捗更新に使用） */
  currentQuestions: PromptInterviewQuestion[];
  /** 改善版 sim の事前定義質問一覧（毎ターン進捗更新に使用） */
  improvedQuestions: PromptInterviewQuestion[];
  /** 現行 sim の mode */
  currentMode: "loop" | "bulk";
  /** 改善版 sim の mode */
  improvedMode: "loop" | "bulk";
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  judgeModel: AiModel;
  includeCurrent: boolean;
  evaluate: boolean;
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

  const simPromises: Array<Promise<SimulationRun>> = [
    runSimulatedInterview({
      persona,
      interviewerSystemPrompt: params.improvedSystemPrompt,
      interviewerModel: params.interviewerModel,
      intervieweeModel: params.intervieweeModel,
      traceId,
      kind: PROMPT_KIND.improved,
      questionsCount: params.improvedQuestionsCount,
      styleAnchors,
      summaryInputs: {
        bill: params.bill,
        interviewConfig: params.improvedInterviewConfig,
      },
      initialTurnEnhancement: {
        billTitle: params.billTitle,
        firstQuestionId: params.improvedFirstQuestionId,
      },
      dynamicStageGuidance: {
        questions: params.improvedQuestions,
        mode: params.improvedMode,
      },
    }),
  ];

  if (params.includeCurrent) {
    simPromises.push(
      runSimulatedInterview({
        persona,
        interviewerSystemPrompt: params.currentSystemPrompt,
        interviewerModel: params.interviewerModel,
        intervieweeModel: params.intervieweeModel,
        traceId,
        kind: PROMPT_KIND.current,
        questionsCount: params.currentQuestionsCount,
        styleAnchors,
        initialTurnEnhancement: {
          billTitle: params.billTitle,
          firstQuestionId: params.currentFirstQuestionId,
        },
        dynamicStageGuidance: {
          questions: params.currentQuestions,
          mode: params.currentMode,
        },
        summaryInputs: {
          bill: params.bill,
          interviewConfig: params.currentInterviewConfig,
        },
      })
    );
  }

  const sims = await Promise.all(simPromises);
  const simulations: SimulationResult["simulations"] = {};
  for (const sim of sims) {
    simulations[sim.promptKind] = sim;
  }

  const evaluations: SimulationResult["evaluations"] = {};
  let evaluationVsOriginal: JudgeVsOriginalVerdict | null = null;
  let judgeModelUsed: AiModel | null = null;
  const currentSim = simulations[PROMPT_KIND.current];
  const improvedSim = simulations[PROMPT_KIND.improved];

  // Judge はすべて並列実行（独立した評価）
  const judgePromises: Array<Promise<void>> = [];

  // 改善版 sim vs 元の実インタビュー（主役の評価）
  if (
    params.evaluate &&
    improvedSim &&
    params.original.conversation.length > 0
  ) {
    judgePromises.push(
      (async () => {
        try {
          evaluationVsOriginal = await runAiJudgeVsOriginal({
            original: params.original,
            improvedSimulation: {
              interviewerSystemPrompt: improvedSim.interviewerSystemPrompt,
              transcript: improvedSim.transcript,
              stopReason: improvedSim.stopReason,
              askedPredefinedCount: improvedSim.metrics.askedQuestionIds.length,
              totalPredefinedCount: params.improvedQuestionsCount,
            },
            model: params.judgeModel,
            traceId,
          });
          judgeModelUsed = params.judgeModel;
        } catch (error) {
          console.error("[Simulation] AI Judge vs original failed:", error);
        }
      })()
    );
  }

  // 現行 sim vs 改善版 sim（副次評価・includeCurrent=true 時のみ）
  if (params.evaluate && params.includeCurrent && currentSim && improvedSim) {
    judgePromises.push(
      (async () => {
        try {
          const verdict: JudgeVerdict = await runAiJudge({
            persona,
            original: params.original,
            currentSimulation: {
              interviewerSystemPrompt: currentSim.interviewerSystemPrompt,
              transcript: currentSim.transcript,
            },
            improvedSimulation: {
              interviewerSystemPrompt: improvedSim.interviewerSystemPrompt,
              transcript: improvedSim.transcript,
            },
            model: params.judgeModel,
            traceId,
          });
          // 比較判定なので両キーに同じ verdict を入れる
          evaluations[PROMPT_KIND.improved] = verdict;
          evaluations[PROMPT_KIND.current] = verdict;
          judgeModelUsed = params.judgeModel;
        } catch (error) {
          console.error(
            "[Simulation] AI Judge (current vs improved) failed:",
            error
          );
          evaluations[PROMPT_KIND.improved] = null;
          evaluations[PROMPT_KIND.current] = null;
        }
      })()
    );
  }

  await Promise.all(judgePromises);

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
    evaluations,
    evaluationVsOriginal,
    totalElapsedMs,
  };
}
