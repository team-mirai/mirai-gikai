import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "メールアドレスを入力してください" })
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  password: z
    .string({ message: "パスワードを入力してください" })
    .min(1, "パスワードを入力してください"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  email: string;
  app_metadata: {
    roles?: string[];
  };
}

export interface AuthError {
  message: string;
}
