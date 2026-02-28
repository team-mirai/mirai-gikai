import { z } from "zod";

export const expertRegistrationSchema = z.object({
  name: z
    .string()
    .min(1, "お名前を入力してください")
    .max(100, "お名前は100文字以内で入力してください"),
  affiliation: z
    .string()
    .min(1, "ご所属・肩書を入力してください")
    .max(200, "ご所属・肩書は200文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスを入力してください"),
  privacyAgreed: z.literal(true, {
    message: "プライバシーポリシーへの同意が必要です",
  }),
});

export type ExpertRegistrationFormData = z.infer<
  typeof expertRegistrationSchema
>;

/**
 * 有識者リスト登録バナーの表示対象ロールかどうかを判定
 */
export function isExpertRegistrationTargetRole(
  role: string | null | undefined
): boolean {
  return role === "subject_expert" || role === "work_related";
}
