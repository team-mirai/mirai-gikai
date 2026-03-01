import { AI_MODELS } from "@/lib/ai/models";

/** バッチあたりの意見数 */
export const TOPIC_ANALYSIS_BATCH_SIZE = 100;

/** 並列LLM呼び出し上限 */
export const TOPIC_ANALYSIS_MAX_CONCURRENCY = 5;

/** トピックあたりの代表意見数上限 */
export const TOPIC_ANALYSIS_MAX_REPRESENTATIVES = 5;

/** トピック解析で使用するモデル */
export const TOPIC_ANALYSIS_MODEL = AI_MODELS.gemini3_flash_preview;
