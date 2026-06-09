import { AI_MODELS } from "@mirai-gikai/shared/ai/models";

/** Phase1 一次抽出のバッチサイズ（§A.3: 30〜50件/バッチ） */
export const EXTRACT_BATCH_SIZE = 40;

/** Phase3 割当のバッチサイズ（§A.2: 20件/バッチ） */
export const ASSIGN_BATCH_SIZE = 20;

/** バッチ並列実行数（§A.3: 5〜10並列） */
export const MAX_CONCURRENCY = 10;

/** 各 Phase で使用するモデル（§4.4: 一次抽出・統合・割当いずれも Haiku が安定） */
export const TOPIC_MODEL = AI_MODELS.claude_haiku_4_5;

/** プロンプト版（再現性のため version に記録） */
export const PROMPT_VERSION = "v1";

/** 実行ステップ（current_step） */
export const ANALYSIS_STEPS = {
  EXTRACT: "extract",
  MERGE: "merge",
  ASSIGN: "assign",
  DONE: "done",
} as const;
