/**
 * インタビューチャットで選択可能なAIモデルの定義
 * Vercel AI Gateway（https://vercel.com/ai-gateway/models）で利用可能なモデル
 */

import {
  estimateInterviewCostUsd,
  formatEstimatedCost,
} from "./estimate-interview-cost";

type ChatModelOption = {
  value: string;
  label: string;
  estimatedCost: string | null;
};

export type ChatModelGroup = {
  provider: string;
  options: ChatModelOption[];
};

const OPENAI_MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4.1", label: "GPT-4.1" },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 mini" },
  { value: "openai/gpt-4.1-nano", label: "GPT-4.1 nano" },
  { value: "openai/o3-mini", label: "o3-mini" },
  { value: "openai/o4-mini", label: "o4-mini" },
  { value: "openai/gpt-5", label: "GPT-5" },
  { value: "openai/gpt-5-mini", label: "GPT-5 mini" },
  { value: "openai/gpt-5-nano", label: "GPT-5 nano" },
  { value: "openai/gpt-5-chat", label: "GPT-5 Chat" },
  { value: "openai/gpt-5.1-instant", label: "GPT-5.1 Instant" },
  { value: "openai/gpt-5.1-thinking", label: "GPT-5.1 Thinking" },
  { value: "openai/gpt-5.2", label: "GPT-5.2" },
] as const;

const GOOGLE_MODELS = [
  { value: "google/gemini-3-flash", label: "Gemini 3 Flash" },
  {
    value: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview",
  },
] as const;

const ANTHROPIC_MODELS = [
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6" },
] as const;

/** フラットなモデル一覧（バリデーション用） */
export const CHAT_MODEL_OPTIONS = [
  ...OPENAI_MODELS,
  ...GOOGLE_MODELS,
  ...ANTHROPIC_MODELS,
] as const;

export type ChatModelValue = (typeof CHAT_MODEL_OPTIONS)[number]["value"];

function buildGroupOptions(
  models: ReadonlyArray<{ value: string; label: string }>
): ChatModelOption[] {
  return models.map((m) => {
    const cost = estimateInterviewCostUsd(m.value);
    return {
      value: m.value,
      label: m.label,
      estimatedCost: cost !== null ? formatEstimatedCost(cost) : null,
    };
  });
}

/** プロバイダー別にグループ化されたモデル一覧（UI表示用） */
export const CHAT_MODEL_GROUPS: ChatModelGroup[] = [
  { provider: "OpenAI", options: buildGroupOptions(OPENAI_MODELS) },
  { provider: "Google", options: buildGroupOptions(GOOGLE_MODELS) },
  { provider: "Anthropic", options: buildGroupOptions(ANTHROPIC_MODELS) },
];

/** 文字列が有効なチャットモデルIDかどうかを検証する */
export function isValidChatModel(model: string): model is ChatModelValue {
  return CHAT_MODEL_OPTIONS.some((opt) => opt.value === model);
}
