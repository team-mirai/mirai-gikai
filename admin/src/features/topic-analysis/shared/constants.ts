import { AI_MODELS } from "@/lib/ai/models";

/** バッチあたりの意見数 */
export const TOPIC_ANALYSIS_BATCH_SIZE = 25;

/** 並列LLM呼び出し上限 */
export const TOPIC_ANALYSIS_MAX_CONCURRENCY = 100;

/** トピックあたりの代表意見数上限 */
export const TOPIC_ANALYSIS_MAX_REPRESENTATIVES = 5;

/** トピック解析で使用するモデル */
export const TOPIC_ANALYSIS_MODEL = AI_MODELS.gemini3_1_flash_lite_preview;

/** トピックレポート生成と全体サマリで使用するモデル */
export const TOPIC_ANALYSIS_WRITING_MODEL = AI_MODELS.gemini3_flash_preview;

/** 解析パイプラインの全ステップ数 */
export const ANALYSIS_TOTAL_STEPS = 7;

/** 解析パイプラインの各ステップ定義 */
export const ANALYSIS_STEPS = {
  FETCH_DATA: { label: "データ取得中", order: 1 },
  EXTRACT_TOPICS: { label: "トピック抽出中", order: 2 },
  MERGE_TOPICS: { label: "トピック統合中", order: 3 },
  CLASSIFY_OPINIONS: { label: "意見分類中", order: 4 },
  GENERATE_REPORTS: { label: "トピックレポート生成中", order: 5 },
  GENERATE_SUMMARY: { label: "全体サマリ生成中", order: 6 },
  SAVE_RESULTS: { label: "結果保存中", order: 7 },
} as const;
