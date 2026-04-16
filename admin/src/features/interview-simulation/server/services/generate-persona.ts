import "server-only";

import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import {
  type PersonaCharacterSheet,
  personaSchema,
} from "../../shared/schemas";
import type { OriginalInterviewSnapshot } from "../../shared/types";
import { buildPersonaExtractorPrompt } from "../../shared/utils/build-persona-extractor-prompt";

interface GeneratePersonaParams {
  original: OriginalInterviewSnapshot;
  model: AiModel;
  traceId: string;
  /** クライアント abort 時に LLM 呼び出しも停止させる */
  signal?: AbortSignal;
}

/**
 * 過去レポートからシミュ用ペルソナを 1 件生成する。
 * 失敗時 1 回リトライ。
 */
export async function generatePersona({
  original,
  model,
  traceId,
  signal,
}: GeneratePersonaParams): Promise<PersonaCharacterSheet> {
  const prompt = buildPersonaExtractorPrompt(original);

  const callOnce = async () =>
    generateObject({
      model,
      schema: personaSchema,
      prompt,
      abortSignal: signal,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "sim-extract-persona",
        metadata: {
          traceId,
          reportId: original.reportId,
        },
      },
    });

  try {
    const { object } = await callOnce();
    return object;
  } catch (error) {
    console.warn(
      "[Simulation] persona extraction failed, retrying once",
      error
    );
    const { object } = await callOnce();
    return object;
  }
}
