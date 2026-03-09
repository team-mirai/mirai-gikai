import type { LanguageModelUsage } from "ai";
import { AI_MODELS } from "./models";

export type ModelPricing = {
  inputTokensPerMillionUsd: number;
  outputTokensPerMillionUsd: number;
};

export type SanitizedUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export const modelPricing: Record<string, ModelPricing> = {
  // --- OpenAI ---
  [AI_MODELS.gpt4o]: {
    inputTokensPerMillionUsd: 2.5,
    outputTokensPerMillionUsd: 10,
  },
  [AI_MODELS.gpt4o_mini]: {
    inputTokensPerMillionUsd: 0.15,
    outputTokensPerMillionUsd: 0.6,
  },
  [AI_MODELS.gpt4_1]: {
    inputTokensPerMillionUsd: 2,
    outputTokensPerMillionUsd: 8,
  },
  [AI_MODELS.gpt4_1_mini]: {
    inputTokensPerMillionUsd: 0.4,
    outputTokensPerMillionUsd: 1.6,
  },
  [AI_MODELS.gpt4_1_nano]: {
    inputTokensPerMillionUsd: 0.1,
    outputTokensPerMillionUsd: 0.4,
  },
  [AI_MODELS.o3_mini]: {
    inputTokensPerMillionUsd: 1.1,
    outputTokensPerMillionUsd: 4.4,
  },
  [AI_MODELS.o4_mini]: {
    inputTokensPerMillionUsd: 1.1,
    outputTokensPerMillionUsd: 4.4,
  },
  [AI_MODELS.gpt5]: {
    inputTokensPerMillionUsd: 1.25,
    outputTokensPerMillionUsd: 10,
  },
  [AI_MODELS.gpt5_mini]: {
    inputTokensPerMillionUsd: 0.25,
    outputTokensPerMillionUsd: 2,
  },
  [AI_MODELS.gpt5_nano]: {
    inputTokensPerMillionUsd: 0.05,
    outputTokensPerMillionUsd: 0.4,
  },
  [AI_MODELS.gpt5_chat]: {
    inputTokensPerMillionUsd: 1.25,
    outputTokensPerMillionUsd: 10,
  },
  [AI_MODELS.gpt5_1_instant]: {
    inputTokensPerMillionUsd: 1.25,
    outputTokensPerMillionUsd: 10,
  },
  [AI_MODELS.gpt5_1_thinking]: {
    inputTokensPerMillionUsd: 1.25,
    outputTokensPerMillionUsd: 10,
  },
  [AI_MODELS.gpt5_2]: {
    inputTokensPerMillionUsd: 1.75,
    outputTokensPerMillionUsd: 14,
  },
  // --- Google ---
  [AI_MODELS.gemini3_flash]: {
    inputTokensPerMillionUsd: 0.5,
    outputTokensPerMillionUsd: 3,
  },
  [AI_MODELS.gemini3_flash_preview]: {
    inputTokensPerMillionUsd: 0.5,
    outputTokensPerMillionUsd: 3,
  },
  [AI_MODELS.gemini3_1_pro_preview]: {
    inputTokensPerMillionUsd: 2,
    outputTokensPerMillionUsd: 12,
  },
  // --- Anthropic ---
  [AI_MODELS.claude_haiku_4_5]: {
    inputTokensPerMillionUsd: 1,
    outputTokensPerMillionUsd: 5,
  },
  [AI_MODELS.claude_sonnet_4_6]: {
    inputTokensPerMillionUsd: 3,
    outputTokensPerMillionUsd: 15,
  },
  [AI_MODELS.claude_opus_4_6]: {
    inputTokensPerMillionUsd: 5,
    outputTokensPerMillionUsd: 25,
  },
};

const COST_DECIMALS = 6;

export function sanitizeUsage(usage: LanguageModelUsage): SanitizedUsage {
  const inputTokens = ensureInteger(usage.inputTokens);
  const outputTokens = ensureInteger(usage.outputTokens);
  let totalTokens = ensureInteger(usage.totalTokens);

  if (inputTokens > 0 || outputTokens > 0) {
    if (totalTokens <= 0) {
      totalTokens = ensureInteger(inputTokens + outputTokens);
    }
    return { inputTokens, outputTokens, totalTokens };
  }

  if (totalTokens > 0) {
    const half = Math.floor(totalTokens / 2);
    return {
      inputTokens: half,
      outputTokens: totalTokens - half,
      totalTokens,
    };
  }

  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function calculateUsageCostUsd(
  model: string,
  usage: SanitizedUsage
): number {
  const pricing = modelPricing[model];
  if (!pricing) {
    throw new Error(`Unknown pricing for model "${model}"`);
  }

  const inputCost =
    (pricing.inputTokensPerMillionUsd * usage.inputTokens) / 1_000_000;
  const outputCost =
    (pricing.outputTokensPerMillionUsd * usage.outputTokens) / 1_000_000;

  return roundCost(inputCost + outputCost);
}

export function roundCost(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const scale = 10 ** COST_DECIMALS;
  return Math.round(value * scale) / scale;
}

function ensureInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}
