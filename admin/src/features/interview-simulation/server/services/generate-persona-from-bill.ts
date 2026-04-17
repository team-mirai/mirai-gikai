import "server-only";

import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
} from "@mirai-gikai/shared/interview-prompts/types";
import { generateObject, NoObjectGeneratedError } from "ai";
import type { AiModel } from "@/lib/ai/models";
import { LLM_MAX_ATTEMPTS, LLM_TIMEOUT_MS } from "../../shared/constants";
import {
  type PersonaCharacterSheet,
  personaSchema,
} from "../../shared/schemas";
import { buildPersonaFromBillPrompt } from "../../shared/utils/build-persona-from-bill-prompt";
import { withTimeoutRetry } from "../../shared/utils/with-timeout-retry";

interface GeneratePersonaFromBillParams {
  bill: PromptBillInput;
  interviewConfig: PromptInterviewConfig;
  stanceHint?: "for" | "against" | "neutral";
  roleHint?: string;
  model: AiModel;
  traceId: string;
  /** クライアント abort 時に LLM 呼び出しも停止させる */
  signal?: AbortSignal;
}

/**
 * 法案内容からシミュ用ペルソナを 1 件生成する。
 * タイムアウト + 自動リトライは withTimeoutRetry ヘルパに委譲。
 */
export async function generatePersonaFromBill({
  bill,
  interviewConfig,
  stanceHint,
  roleHint,
  model,
  traceId,
  signal,
}: GeneratePersonaFromBillParams): Promise<PersonaCharacterSheet> {
  const prompt = buildPersonaFromBillPrompt({
    bill,
    interviewConfig,
    stanceHint,
    roleHint,
  });

  try {
    const { object } = await withTimeoutRetry(
      (attemptSignal) =>
        generateObject({
          model,
          schema: personaSchema,
          prompt,
          abortSignal: attemptSignal,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "sim-generate-persona-from-bill",
            metadata: {
              traceId,
              stanceHint: stanceHint ?? "(none)",
            },
          },
        }),
      {
        externalSignal: signal,
        timeoutMs: LLM_TIMEOUT_MS.persona,
        maxAttempts: LLM_MAX_ATTEMPTS,
        label: "sim-generate-persona-from-bill",
      }
    );

    // stanceHint 指定時は保険として上書き（LLM が無視するケース対策）
    if (stanceHint && object.stance !== stanceHint) {
      object.stance = stanceHint;
    }
    return object;
  } catch (error) {
    // schema 不一致は SDK 側のメッセージだけだと原因が分からないので、
    // 生 text と cause を吐いて次回以降の調査に備える
    if (NoObjectGeneratedError.isInstance(error)) {
      console.warn("[generatePersonaFromBill] schema mismatch", {
        roleHint,
        stanceHint,
        finishReason: error.finishReason,
        cause: error.cause,
        rawText: error.text?.slice(0, 1000),
      });
    }
    throw error;
  }
}
