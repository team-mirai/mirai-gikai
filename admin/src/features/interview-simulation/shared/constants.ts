import { AI_MODELS } from "@/lib/ai/models";

/** シミュレーション 1 本あたりの最大ターン数（interviewer + interviewee の往復）。
 *  タイムマネジメントの動的更新で自然に要約遷移するのが理想で、これは安全弁。 */
export const SIMULATION_MAX_TURNS = 20;

/** 複数ペルソナ並列シミュで一度に実行できるスロット数の上限（コスト・レート制限観点） */
export const MAX_PERSONA_SLOTS = 10;

/** UI 上で推奨する上限。これを超えると警告を出す想定 */
export const RECOMMENDED_PERSONA_SLOTS = 6;

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

/**
 * LLM 個別呼び出しのタイムアウト (ms)。
 * 呼び出し種別ごとに、処理重さに応じた ceiling を設定する。
 * タイムアウト時は withTimeoutRetry 側で LLM_MAX_ATTEMPTS 回までリトライする。
 */
export const LLM_TIMEOUT_MS = {
  /** インタビュアー / インタビュイーの 1 ターン生成。短文なので 20s で十分 */
  interviewTurn: 20_000,
  /** Summary フェーズのレポート生成（transcript 全体を読むのでやや長め） */
  summary: 30_000,
  /** ペルソナ生成（report 抽出 / bill 生成とも）。推論量が多め */
  persona: 60_000,
  /** 満足度評価（transcript 全体を読む） */
  satisfaction: 45_000,
  /** 総合評価（全ペルソナの情報を横断） */
  overallEvaluation: 60_000,
} as const;

/** LLM 呼び出しの最大試行回数（1 = リトライなし、2 = 1 回リトライ） */
export const LLM_MAX_ATTEMPTS = 2;
