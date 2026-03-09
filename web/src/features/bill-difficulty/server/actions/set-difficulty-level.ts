"use server";

import type { DifficultyLevelEnum } from "../../shared/types";
import { setDifficultyLevelCore } from "../services/set-difficulty-level-core";

/**
 * 難易度設定をCookieに保存
 * Client Componentsから呼び出されるServer Action
 */
export async function setDifficultyLevel(level: DifficultyLevelEnum) {
  return setDifficultyLevelCore(level);
}
