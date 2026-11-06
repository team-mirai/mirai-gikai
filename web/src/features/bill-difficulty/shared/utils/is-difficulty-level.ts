import {
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "../types/index";

/**
 * 有効な難易度レベルかを判定する型ガード。
 */
export function isDifficultyLevel(
  value: string | null | undefined
): value is DifficultyLevelEnum {
  if (!value) return false;
  return VALID_DIFFICULTY_LEVELS.includes(value as DifficultyLevelEnum);
}
