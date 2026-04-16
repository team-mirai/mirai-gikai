import "server-only";

import { generateObject } from "ai";
import type { AiModel } from "@/lib/ai/models";
import {
  type JudgeVerdict,
  judgeVerdictSchema,
  type PersonaCharacterSheet,
  type SimulatedTurn,
} from "../../shared/schemas";
import type { OriginalInterviewSnapshot } from "../../shared/types";
import { buildJudgePrompt } from "../../shared/utils/build-judge-prompt";

interface RunAiJudgeParams {
  persona: PersonaCharacterSheet;
  original: OriginalInterviewSnapshot;
  currentSimulation: {
    interviewerSystemPrompt: string;
    transcript: SimulatedTurn[];
  };
  improvedSimulation: {
    interviewerSystemPrompt: string;
    transcript: SimulatedTurn[];
  };
  model: AiModel;
  traceId: string;
}

/**
 * 2 つの sim transcript を比較評価する Judge を 1 回呼ぶ
 */
export async function runAiJudge({
  persona,
  original,
  currentSimulation,
  improvedSimulation,
  model,
  traceId,
}: RunAiJudgeParams): Promise<JudgeVerdict> {
  const prompt = buildJudgePrompt({
    persona,
    original,
    currentSimulation,
    improvedSimulation,
  });

  const { object } = await generateObject({
    model,
    schema: judgeVerdictSchema,
    prompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "sim-judge",
      metadata: {
        traceId,
        reportId: original.reportId,
      },
    },
  });

  return object;
}
