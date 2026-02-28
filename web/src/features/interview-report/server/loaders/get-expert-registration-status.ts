import "server-only";

import { findExpertRegistrationBySessionId } from "../repositories/expert-registration-repository";

/**
 * セッションIDに対する有識者登録の有無を確認
 */
export async function getExpertRegistrationStatus(
  sessionId: string
): Promise<boolean> {
  const registration = await findExpertRegistrationBySessionId(sessionId);
  return registration !== null;
}
