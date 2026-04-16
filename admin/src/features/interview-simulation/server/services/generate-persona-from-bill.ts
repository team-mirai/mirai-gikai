import "server-only";

import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
} from "@mirai-gikai/shared/interview-prompts/types";
import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import {
  type PersonaCharacterSheet,
  personaSchema,
} from "../../shared/schemas";
import { buildPersonaFromBillPrompt } from "../../shared/utils/build-persona-from-bill-prompt";

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
 * 過去レポートがない段階でもシミュレートできるよう、LLM に当事者像を組み立てさせる。
 * 失敗時 1 回リトライ。
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

  const callOnce = async () =>
    generateObject({
      model,
      schema: personaSchema,
      prompt,
      abortSignal: signal,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "sim-generate-persona-from-bill",
        metadata: {
          traceId,
          stanceHint: stanceHint ?? "(none)",
        },
      },
    });

  try {
    const { object } = await callOnce();
    // stanceHint 指定時は保険として上書き（LLM が無視するケース対策）
    if (stanceHint && object.stance !== stanceHint) {
      object.stance = stanceHint;
    }
    return object;
  } catch (error) {
    console.warn(
      "[Simulation] persona generation from bill failed, retrying once",
      error
    );
    const { object } = await callOnce();
    if (stanceHint && object.stance !== stanceHint) {
      object.stance = stanceHint;
    }
    return object;
  }
}
