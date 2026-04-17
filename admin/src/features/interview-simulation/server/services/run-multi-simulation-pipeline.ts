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
  MultiSimulationProgressEvent,
  MultiSimulationResult,
  OriginalInterviewSnapshot,
  PersonaSimulationResult,
  PersonaSlotInput,
} from "../../shared/types";
import { describePersonaSlot } from "../../shared/utils/describe-persona-slot";
import { extractOriginalStyleAnchors } from "../../shared/utils/extract-original-style-anchors";
import { getReportDetailForSimulation } from "../loaders/get-report-detail-for-simulation";
import { evaluateIntervieweeSatisfaction } from "./evaluate-interviewee-satisfaction";
import { generatePersona } from "./generate-persona";
import { generatePersonaFromBill } from "./generate-persona-from-bill";
import { planDiverseRoles } from "./plan-diverse-roles";
import { runSimulatedInterview } from "./run-simulated-interview";
import { summarizeOverallEvaluation } from "./summarize-overall-evaluation";

/** プランナーで決まった当事者像（roleHint 未指定の bill スロットへ注入する） */
interface PlannedSlotHint {
  roleHint: string;
  stanceHint: "for" | "against" | "neutral";
}

/** 全スロット共通の改善版 config 素材 */
interface ImprovedPromptInputs {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  questions: PromptInterviewQuestion[];
  mode: "loop" | "bulk";
  estimatedDurationMinutes: number | null;
}

interface RunMultiSimulationParams {
  /** 対象法案 ID。report スロットが別法案のレポートを指していないか検証するのに使う */
  billId: string;
  personaSlots: PersonaSlotInput[];
  /** 全スロット共通の改善版 config */
  improvedPromptInputs: ImprovedPromptInputs;
  /** 初回ターン enhanced prompt で使う billTitle */
  billTitle: string;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  /** ストリーミング進捗コールバック */
  onProgress?: (event: MultiSimulationProgressEvent) => void;
  /** 中断シグナル。末端 LLM 呼び出しまで伝播 */
  signal?: AbortSignal;
}

/**
 * 1 スロット分の実行コンテキスト（persona + 元レポート + style anchors）を用意する。
 * - report スロット: DB からレポート詳細を取得 → persona 抽出 + style anchors 抽出
 * - bill スロット: 法案内容から persona を LLM 生成（style anchors なし）
 */
async function prepareSlotContext(
  slot: PersonaSlotInput,
  params: RunMultiSimulationParams,
  traceId: string,
  emitStatus: (message: string) => void,
  /** 多様性プランナーが決めた roleHint / stanceHint。bill スロット用 */
  plannedHint: PlannedSlotHint | undefined
) {
  if (slot.kind === "report") {
    emitStatus("レポート取得中...");
    const detail = await getReportDetailForSimulation(slot.reportId);
    if (!detail) {
      throw new Error(
        `対象のレポートが見つかりません (reportId=${slot.reportId})`
      );
    }
    // 指定された billId と、report から辿った bill_id が一致しているか検証。
    // 不一致 = UI の想定外 or 別法案のレポート混入なので拒否する。
    if (detail.snapshot.billId !== params.billId) {
      throw new Error("選択されたレポートが対象法案と一致しません");
    }
    emitStatus("ペルソナ抽出中...");
    const persona = await generatePersona({
      original: detail.snapshot,
      model: params.personaModel,
      traceId,
      signal: params.signal,
    });
    const styleAnchors = extractOriginalStyleAnchors(
      detail.snapshot.conversation
    );
    return {
      persona,
      original: detail.snapshot as OriginalInterviewSnapshot | null,
      styleAnchors,
    };
  }

  // ユーザー指定の hint があれば最優先。なければ planner が決めた hint を採用
  const effectiveRoleHint = slot.roleHint ?? plannedHint?.roleHint;
  const effectiveStanceHint = slot.stanceHint ?? plannedHint?.stanceHint;

  emitStatus("ペルソナ生成中...");
  const persona = await generatePersonaFromBill({
    bill: params.improvedPromptInputs.bill,
    interviewConfig: params.improvedPromptInputs.interviewConfig,
    stanceHint: effectiveStanceHint,
    roleHint: effectiveRoleHint,
    model: params.personaModel,
    traceId,
    signal: params.signal,
  });
  return {
    persona,
    original: null as OriginalInterviewSnapshot | null,
    styleAnchors: undefined,
  };
}

/**
 * 多様性プランナーで埋めるべき bill スロット（roleHint 未指定）を抽出し、
 * personaIndex → 計画された hint のマップを返す。
 *
 * 計画対象が 2 件未満の場合は LLM を呼ばず空マップを返す
 * （単独スロットに多様性プランニングは不要）。
 * プランナーが失敗した場合も空マップを返し、各スロットは従来通り個別生成にフォールバックする。
 */
async function buildPlannedHints(
  params: RunMultiSimulationParams,
  traceId: string,
  emitGlobalStatus: (message: string) => void
): Promise<Map<number, PlannedSlotHint>> {
  const slotsToPlan: Array<{
    index: number;
    stanceHint?: "for" | "against" | "neutral";
  }> = [];
  const preassignedRoleHints: string[] = [];

  params.personaSlots.forEach((slot, index) => {
    if (slot.kind !== "bill") return;
    const trimmed = slot.roleHint?.trim();
    if (trimmed) {
      preassignedRoleHints.push(trimmed);
    } else {
      slotsToPlan.push({ index, stanceHint: slot.stanceHint });
    }
  });

  const plannedHints = new Map<number, PlannedSlotHint>();
  if (slotsToPlan.length < 2) return plannedHints;

  emitGlobalStatus("多様な当事者像を計画中...");
  const plan = await planDiverseRoles({
    bill: params.improvedPromptInputs.bill,
    interviewConfig: params.improvedPromptInputs.interviewConfig,
    slotsToPlan: slotsToPlan.map((s) => ({ stanceHint: s.stanceHint })),
    preassignedRoleHints,
    model: params.personaModel,
    traceId,
    signal: params.signal,
  });
  if (!plan) return plannedHints;

  plan.roles.forEach((role, i) => {
    const meta = slotsToPlan[i];
    if (!meta) return;
    plannedHints.set(meta.index, {
      roleHint: role.role_hint,
      stanceHint: role.stance,
    });
  });
  return plannedHints;
}

/**
 * 複数ペルソナ並列シミュレーションのエントリポイント。
 * 各スロットを Promise.all で並列に走らせ、スロット個別の失敗は persona_error
 * イベントとして配信しつつ他スロットの実行は継続する。
 */
export async function runMultiSimulationPipeline(
  params: RunMultiSimulationParams
): Promise<MultiSimulationResult> {
  await registerNodeTelemetry();

  const startedAt = Date.now();
  const traceId = randomUUID();
  const emit = params.onProgress;

  console.log(
    `[MultiSimulation] start traceId=${traceId} slots=${params.personaSlots.length}`
  );

  // plan イベント: 全スロットのプレースホルダを UI に先渡し
  const descriptors = params.personaSlots.map((source, personaIndex) => ({
    personaIndex,
    source,
    label: describePersonaSlot(source),
  }));
  emit?.({ type: "plan", personaSlots: descriptors });

  // roleHint 未指定の bill スロットが複数ある場合のみ、事前に多様性プランナーを 1 回走らせる
  const plannedHints = await buildPlannedHints(params, traceId, (message) =>
    emit?.({ type: "global_status", message })
  );

  const slotResults = await Promise.all(
    params.personaSlots.map(async (slot, personaIndex) => {
      const slotStartedAt = Date.now();
      emit?.({ type: "persona_started", personaIndex });
      const emitSlotStatus = (message: string) =>
        emit?.({ type: "persona_status", personaIndex, message });

      try {
        const { persona, original, styleAnchors } = await prepareSlotContext(
          slot,
          params,
          traceId,
          emitSlotStatus,
          plannedHints.get(personaIndex)
        );

        emitSlotStatus("シミュレーション実行中...");
        const run = await runSimulatedInterview({
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
            firstQuestionId:
              params.improvedPromptInputs.questions[0]?.id ?? null,
          },
          estimatedDurationMinutes:
            params.improvedPromptInputs.estimatedDurationMinutes,
          onTurnComplete: emit
            ? (turnIndex, turn) =>
                emit({ type: "turn", personaIndex, turnIndex, turn })
            : undefined,
          signal: params.signal,
        });

        // 満足度評価: persona.message_to_politicians が transcript で
        // どれだけ引き出されたかを LLM に判定させる
        emitSlotStatus("満足度評価中...");
        const satisfaction = await evaluateIntervieweeSatisfaction({
          persona,
          transcript: run.transcript,
          model: params.personaModel,
          traceId,
          personaIndex,
          signal: params.signal,
        });

        const result: PersonaSimulationResult = {
          personaIndex,
          personaSource: slot,
          persona,
          personaModel: params.personaModel,
          original,
          run,
          elapsedMs: Date.now() - slotStartedAt,
          error: null,
          satisfaction,
        };
        emit?.({ type: "persona_complete", personaIndex, result });
        return result;
      } catch (error) {
        // 全体 abort の場合は他スロットも reject されるので、伝播させる
        if (params.signal?.aborted) {
          throw error;
        }
        const message =
          error instanceof Error
            ? error.message
            : "スロットの実行に失敗しました";
        console.error(`[MultiSimulation] slot ${personaIndex} failed:`, error);
        emit?.({ type: "persona_error", personaIndex, message });
        return null;
      }
    })
  );

  const completedSlots = slotResults.filter(
    (s): s is PersonaSimulationResult => s !== null
  );

  // 全スロット完走後、横断評価の LLM を 1 回だけ呼ぶ
  let overallEvaluation: Awaited<
    ReturnType<typeof summarizeOverallEvaluation>
  > = null;
  if (completedSlots.length > 0) {
    emit?.({ type: "overall_evaluation_started" });
    try {
      overallEvaluation = await summarizeOverallEvaluation({
        slots: completedSlots.map((s) => ({
          personaIndex: s.personaIndex,
          persona: s.persona,
          satisfaction: s.satisfaction,
        })),
        model: params.personaModel,
        traceId,
        signal: params.signal,
      });
    } catch (error) {
      console.warn("[MultiSimulation] overall evaluation threw", error);
      overallEvaluation = null;
    }
    // start を emit したら必ず complete / failed のどちらかで終端イベントを配信する
    // （UI 側 reducer が "running" に張り付かないように）
    if (overallEvaluation) {
      emit?.({
        type: "overall_evaluation_complete",
        evaluation: overallEvaluation,
      });
    } else {
      emit?.({
        type: "overall_evaluation_failed",
        message: "総合評価の生成に失敗しました",
      });
    }
  }

  const totalElapsedMs = Date.now() - startedAt;
  emit?.({ type: "all_complete", totalElapsedMs });
  console.log(
    `[MultiSimulation] done traceId=${traceId} completed=${completedSlots.length}/${params.personaSlots.length} elapsedMs=${totalElapsedMs}`
  );

  return {
    slots: completedSlots,
    overallEvaluation,
    totalElapsedMs,
  };
}
