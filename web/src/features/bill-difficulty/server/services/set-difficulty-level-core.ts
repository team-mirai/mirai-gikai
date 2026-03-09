import { cookies } from "next/headers";
import {
  DIFFICULTY_COOKIE_NAME,
  DIFFICULTY_COOKIE_OPTIONS,
  type DifficultyLevelEnum,
} from "../../shared/types/index";

export type CookieStore = {
  set: (name: string, value: string, options: object) => void;
};

export type SetDifficultyDeps = {
  getCookies?: () => Promise<CookieStore>;
};

/**
 * 難易度設定をCookieに保存するコアロジック
 * テストからはDIでcookiesを差し替え可能
 */
export async function setDifficultyLevelCore(
  level: DifficultyLevelEnum,
  deps?: SetDifficultyDeps
) {
  const getCookies = deps?.getCookies ?? cookies;
  const cookieStore = await getCookies();
  cookieStore.set(DIFFICULTY_COOKIE_NAME, level, DIFFICULTY_COOKIE_OPTIONS);
}
