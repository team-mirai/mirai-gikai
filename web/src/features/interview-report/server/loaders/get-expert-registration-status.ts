import "server-only";

import { findExpertRegistrationByUserId } from "../repositories/expert-registration-repository";

/**
 * ユーザーIDに対する有識者登録の有無を確認
 */
export async function getExpertRegistrationStatus(
  userId: string
): Promise<boolean> {
  const registration = await findExpertRegistrationByUserId(userId);
  return registration !== null;
}
