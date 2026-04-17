import "server-only";

import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
} from "@mirai-gikai/shared/interview-prompts/types";
import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import { LLM_MAX_ATTEMPTS, LLM_TIMEOUT_MS } from "../../shared/constants";
import {
  type DiverseRolesPlan,
  diverseRolesPlanSchema,
} from "../../shared/schemas";
import {
  buildDiverseRolesPlanPrompt,
  type DiversePlanSlotInput,
} from "../../shared/utils/build-diverse-roles-plan-prompt";
import { withTimeoutRetry } from "../../shared/utils/with-timeout-retry";

interface PlanDiverseRolesParams {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  slotsToPlan: DiversePlanSlotInput[];
  preassignedRoleHints?: string[];
  model: AiModel;
  traceId: string;
  signal?: AbortSignal;
}

/**
 * 多様な当事者像を 1 回の LLM 呼び出しでまとめてプランニングする。
 *
 * 失敗時は null を返す（呼び出し側で fallback して各スロットを単独生成に戻す）。
 * 出力配列は入力 slotsToPlan と同じ順序であることを期待する（プロンプトで明示）。
 */
export async function planDiverseRoles({
  bill,
  interviewConfig,
  slotsToPlan,
  preassignedRoleHints,
  model,
  traceId,
  signal,
}: PlanDiverseRolesParams): Promise<DiverseRolesPlan | null> {
  if (slotsToPlan.length === 0) return null;

  const prompt = buildDiverseRolesPlanPrompt({
    bill,
    interviewConfig,
    slotsToPlan,
    preassignedRoleHints,
  });

  try {
    const { object } = await withTimeoutRetry(
      (attemptSignal) =>
        generateObject({
          model,
          schema: diverseRolesPlanSchema,
          prompt,
          abortSignal: attemptSignal,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "sim-plan-diverse-roles",
            metadata: {
              traceId,
              slotCount: slotsToPlan.length,
            },
          },
        }),
      {
        externalSignal: signal,
        timeoutMs: LLM_TIMEOUT_MS.persona,
        maxAttempts: LLM_MAX_ATTEMPTS,
        label: "sim-plan-diverse-roles",
      }
    );

    if (object.roles.length !== slotsToPlan.length) {
      console.warn(
        `[planDiverseRoles] expected ${slotsToPlan.length} roles, got ${object.roles.length}; falling back`
      );
      return null;
    }
    // ユーザー指定の stanceHint と planner 出力 stance が矛盾していないか検証。
    // 下流の generatePersonaFromBill は stanceHint を最優先で使うので実害は
    // ないが、planner 側が指示に追従していない兆候なのでログを残して fallback
    for (let i = 0; i < slotsToPlan.length; i++) {
      const slotHint = slotsToPlan[i]?.stanceHint;
      const plannedStance = object.roles[i]?.stance;
      if (slotHint && plannedStance && slotHint !== plannedStance) {
        console.warn(
          `[planDiverseRoles] stanceHint mismatch at slot ${i}: hint=${slotHint} planner=${plannedStance}; falling back`
        );
        return null;
      }
    }
    return object;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn(
      "[planDiverseRoles] failed; falling back to per-slot defaults",
      error
    );
    return null;
  }
}
