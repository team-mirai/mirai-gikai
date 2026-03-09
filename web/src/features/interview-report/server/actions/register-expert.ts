"use server";

import { getAuthenticatedUser } from "@/features/interview-session/server/utils/verify-session-ownership";
import { expertRegistrationSchema } from "../../shared/utils/expert-registration-validation";
import {
  createExpertRegistration,
  findExpertRegistrationByEmail,
  findExpertRegistrationByUserId,
} from "../repositories/expert-registration-repository";

interface RegisterExpertResult {
  success: boolean;
  error?: string;
}

/**
 * 有識者リストに登録する
 */
export async function registerExpert(formData: {
  name: string;
  affiliation: string;
  email: string;
  privacyAgreed: boolean;
}): Promise<RegisterExpertResult> {
  const authResult = await getAuthenticatedUser();

  if (!authResult.authenticated) {
    return { success: false, error: authResult.error };
  }

  const parsed = expertRegistrationSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "入力内容に誤りがあります",
    };
  }

  try {
    const existingByUser = await findExpertRegistrationByUserId(
      authResult.userId
    );
    if (existingByUser) {
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
      userId: authResult.userId,
      name: parsed.data.name,
      affiliation: parsed.data.affiliation,
      email: parsed.data.email,
    });

    return { success: true };
  } catch {
    return { success: false, error: "登録に失敗しました" };
  }
}
