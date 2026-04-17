import "server-only";

import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import {
  type IntervieweeSatisfaction,
  intervieweeSatisfactionSchema,
  type PersonaCharacterSheet,
  type SimulatedTurn,
} from "../../shared/schemas";
import { buildIntervieweeSatisfactionPrompt } from "../../shared/utils/build-interviewee-satisfaction-prompt";

interface EvaluateIntervieweeSatisfactionParams {
  persona: PersonaCharacterSheet;
  transcript: SimulatedTurn[];
  model: AiModel;
  traceId: string;
  personaIndex: number;
  /** クライアント abort 時に LLM 呼び出しも停止させる */
  signal?: AbortSignal;
}

/**
 * persona.message_to_politicians が transcript でどれくらい引き出されたかを
 * LLM に判定させ、1〜5 のスコアと根拠を返す。
 * transcript が短すぎる（ペルソナ発話なし）場合は score=1 でフォールバックを返し、
 * 失敗時も null 系を避けるため固定値を返す（スロット個別エラー扱いにはしない）。
 */
export async function evaluateIntervieweeSatisfaction(
  params: EvaluateIntervieweeSatisfactionParams
): Promise<IntervieweeSatisfaction | null> {
  const { persona, transcript, model, traceId, personaIndex, signal } = params;

  // インタビュイー発話が 1 件もない場合は LLM を呼ばず即 score=1
  const intervieweeTurns = transcript.filter((t) => t.role === "interviewee");
  if (intervieweeTurns.length === 0) {
    return {
      score: 1,
      message_coverage: "not_covered",
      summary:
        "インタビュイーが一度も発話しないまま終了したため、伝えたいことは全く伝えられませんでした。",
      uncovered_points: persona.message_to_politicians
        ? [persona.message_to_politicians]
        : [],
    };
  }

  const prompt = buildIntervieweeSatisfactionPrompt({ persona, transcript });

  try {
    const { object } = await generateObject({
      model,
      schema: intervieweeSatisfactionSchema,
      prompt,
      abortSignal: signal,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "sim-interviewee-satisfaction",
        metadata: { traceId, personaIndex: String(personaIndex) },
      },
    });
    return object;
  } catch (error) {
    console.warn(
      `[Satisfaction] evaluation failed for slot ${personaIndex}`,
      error
    );
    return null;
  }
}
