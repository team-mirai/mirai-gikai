import { cookies } from "next/headers";
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTY_COOKIE_NAME,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "../../shared/types";

/**
 * 有効な難易度レベルかチェック
 */
function isValidDifficultyLevel(value: string): value is DifficultyLevelEnum {
  return VALID_DIFFICULTY_LEVELS.includes(value as DifficultyLevelEnum);
}

/**
 * 現在の難易度設定をCookieから取得
 * Server Componentsから呼び出される読み取り専用の関数
 *
 * Note: URLパラメータ ?difficulty=hard がある場合、
 * Middlewareで自動的にCookieにセットされるため、
 * この関数は常にCookieから取得するだけでOK
 */
export async function getDifficultyLevel(): Promise<DifficultyLevelEnum> {
  const cookieStore = await cookies();
  const difficulty = cookieStore.get(DIFFICULTY_COOKIE_NAME);

  if (!difficulty) {
    return DEFAULT_DIFFICULTY;
  }

  // 有効な値かチェック
  if (isValidDifficultyLevel(difficulty.value)) {
    return difficulty.value;
  }

  return DEFAULT_DIFFICULTY;
}
