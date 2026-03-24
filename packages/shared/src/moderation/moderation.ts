/**
 * モデレーションスコアの閾値定義
 * score 0 = 完全に適切, score 100 = 完全に不適切
 */
export const MODERATION_THRESHOLDS = {
  /** WARNING閾値: この値以上がWARNING */
  WARNING: 30,
  /** NG閾値: この値以上がNG */
  NG: 70,
} as const;

/** DB enum `moderation_status_enum` と同期が必要 */
export type ModerationStatus = "ok" | "warning" | "ng";

/**
 * モデレーションスコアからステータスを判定する
 * @param score 0-100の整数。0が最も適切、100が最も不適切
 */
export function determineModerationStatus(score: number): ModerationStatus {
  if (score >= MODERATION_THRESHOLDS.NG) return "ng";
  if (score >= MODERATION_THRESHOLDS.WARNING) return "warning";
  return "ok";
}
