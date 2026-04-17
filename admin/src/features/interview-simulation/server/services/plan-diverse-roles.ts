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
  slotsToplan: DiversePlanSlotInput[];
  preassignedRoleHints?: string[];
  model: AiModel;
  traceId: string;
  signal?: AbortSignal;
}

/**
 * 多様な当事者像を 1 回の LLM 呼び出しでまとめてプランニングする。
 *
 * 失敗時は null を返す（呼び出し側で fallback して各スロットを単独生成に戻す）。
 * 出力配列は入力 slotsToplan と同じ順序であることを期待する（プロンプトで明示）。
 */
export async function planDiverseRoles({
  bill,
  interviewConfig,
  slotsToplan,
  preassignedRoleHints,
  model,
  traceId,
  signal,
}: PlanDiverseRolesParams): Promise<DiverseRolesPlan | null> {
  if (slotsToplan.length === 0) return null;

  const prompt = buildDiverseRolesPlanPrompt({
    bill,
    interviewConfig,
    slotsToplan,
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
              slotCount: slotsToplan.length,
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

    if (object.roles.length !== slotsToplan.length) {
      console.warn(
        `[planDiverseRoles] expected ${slotsToplan.length} roles, got ${object.roles.length}; falling back`
      );
      return null;
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
