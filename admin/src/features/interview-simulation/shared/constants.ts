import { AI_MODELS } from "@/lib/ai/models";

/** シミュレーション 1 本あたりの最大ターン数（interviewer + interviewee の往復）。
 *  タイムマネジメントの動的更新で自然に要約遷移するのが理想で、これは安全弁。 */
export const SIMULATION_MAX_TURNS = 20;

/** UI のモデル選択肢として提示するモデル一覧 */
export const SIMULATION_MODEL_OPTIONS = [
  { value: AI_MODELS.gpt5_2, label: "GPT-5.2" },
  { value: AI_MODELS.gpt5_1_thinking, label: "GPT-5.1 Thinking" },
  { value: AI_MODELS.gpt5_1_instant, label: "GPT-5.1 Instant" },
  { value: AI_MODELS.gpt4_1, label: "GPT-4.1" },
  { value: AI_MODELS.gpt4_1_mini, label: "GPT-4.1 mini" },
  { value: AI_MODELS.gemini3_flash_preview, label: "Gemini 3 Flash (preview)" },
  { value: AI_MODELS.gemini3_1_pro_preview, label: "Gemini 3.1 Pro (preview)" },
  {
    value: AI_MODELS.gemini3_1_flash_lite_preview,
    label: "Gemini 3.1 Flash Lite (preview)",
  },
  { value: AI_MODELS.claude_sonnet_4_6, label: "Claude Sonnet 4.6" },
] as const;

/** インタビュアー側のデフォルトモデル（プロダクション既存値と一致） */
export const DEFAULT_INTERVIEWER_MODEL = AI_MODELS.gpt5_2;

/** インタビュイー（ペルソナ）側のデフォルトモデル */
export const DEFAULT_INTERVIEWEE_MODEL = AI_MODELS.gemini3_1_flash_lite_preview;

/** ペルソナ抽出のデフォルトモデル */
export const DEFAULT_PERSONA_MODEL = AI_MODELS.gemini3_1_flash_lite_preview;

/** AI Judge のデフォルトモデル */
export const DEFAULT_JUDGE_MODEL = AI_MODELS.gpt5_2;

/** 比較対象のプロンプト種別 */
export const PROMPT_KIND = {
  current: "current",
  improved: "improved",
} as const;

export type PromptKind = (typeof PROMPT_KIND)[keyof typeof PROMPT_KIND];
