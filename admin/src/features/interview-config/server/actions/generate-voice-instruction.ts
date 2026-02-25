"use server";

import { generateText } from "ai";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { AI_MODELS } from "@/lib/ai/models";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { buildVoiceInstructionPrompt } from "../utils/build-voice-instruction-prompt";

type GenerateVoiceInstructionResult =
  | { success: true; data: string }
  | { success: false; error: string };

const VOICE_INSTRUCTION_MAX_LENGTH = 5000;
const VALID_MODES = ["loop", "bulk"] as const;

export async function generateVoiceInstruction(params: {
  themes: string[];
  knowledge_source: string;
  mode: string;
}): Promise<GenerateVoiceInstructionResult> {
  try {
    await requireAdmin();

    const mode = VALID_MODES.includes(
      params.mode as (typeof VALID_MODES)[number]
    )
      ? params.mode
      : "loop";

    const prompt = buildVoiceInstructionPrompt({
      ...params,
      mode,
    });

    const result = await generateText({
      model: AI_MODELS.gpt4o_mini,
      prompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "generate-voice-instruction",
      },
    });

    const text = result.text?.trim();

    if (!text) {
      return {
        success: false,
        error: "音声インタビュー指示の生成結果が空でした",
      };
    }

    const truncated = text.slice(0, VOICE_INSTRUCTION_MAX_LENGTH);

    return { success: true, data: truncated };
  } catch (error) {
    console.error("Generate voice instruction error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "音声インタビュー指示の生成中にエラーが発生しました"
      ),
    };
  }
}
