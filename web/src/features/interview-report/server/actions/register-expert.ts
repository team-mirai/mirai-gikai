"use server";

import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import { expertRegistrationSchema } from "../../shared/utils/expert-registration-validation";
import {
  createExpertRegistration,
  findExpertRegistrationByEmail,
  findExpertRegistrationBySessionId,
} from "../repositories/expert-registration-repository";

interface RegisterExpertResult {
  success: boolean;
  error?: string;
}

/**
 * 有識者リストに登録する
 */
export async function registerExpert(
  sessionId: string,
  formData: {
    name: string;
    affiliation: string;
    email: string;
    privacyAgreed: boolean;
  }
): Promise<RegisterExpertResult> {
  const ownershipResult = await verifySessionOwnership(sessionId);

  if (!ownershipResult.authorized) {
    return { success: false, error: ownershipResult.error };
  }

  const parsed = expertRegistrationSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "入力内容に誤りがあります",
    };
  }

  try {
    const existingBySession =
      await findExpertRegistrationBySessionId(sessionId);
    if (existingBySession) {
      return { success: false, error: "すでに登録済みです" };
    }

    const existingByEmail = await findExpertRegistrationByEmail(
      parsed.data.email
    );
    if (existingByEmail) {
      return {
        success: false,
        error: "このメールアドレスはすでに登録されています",
      };
    }

    await createExpertRegistration({
      interviewSessionId: sessionId,
      name: parsed.data.name,
      affiliation: parsed.data.affiliation,
      email: parsed.data.email,
    });

    return { success: true };
  } catch {
    return { success: false, error: "登録に失敗しました" };
  }
}
