"use server";

import { cookies } from "next/headers";
import {
  DIFFICULTY_COOKIE_NAME,
  DIFFICULTY_COOKIE_OPTIONS,
  type DifficultyLevelEnum,
} from "../../shared/types";

/**
 * 難易度設定をCookieに保存
 * Client Componentsから呼び出されるServer Action
 */
export async function setDifficultyLevel(level: DifficultyLevelEnum) {
  const cookieStore = await cookies();
  cookieStore.set(DIFFICULTY_COOKIE_NAME, level, DIFFICULTY_COOKIE_OPTIONS);
}
