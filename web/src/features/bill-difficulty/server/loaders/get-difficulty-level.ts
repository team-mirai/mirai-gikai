import { cookies } from "next/headers";
import {
  DIFFICULTY_COOKIE_NAME,
  type DifficultyLevelEnum,
} from "../../shared/types";
import { parseDifficultyLevel } from "../../shared/utils/parse-difficulty-level";

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
  return parseDifficultyLevel(difficulty?.value);
}
