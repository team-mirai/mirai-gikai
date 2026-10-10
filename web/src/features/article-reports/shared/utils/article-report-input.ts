import { ARTICLE_REPORT_CATEGORIES } from "@mirai-gikai/shared/article-report/categories";
import { z } from "zod";
import { VALID_DIFFICULTY_LEVELS } from "@/features/bill-difficulty/shared/types";

export const ARTICLE_REPORT_BODY_MAX_LENGTH = 1000;

export const articleReportInputSchema = z.object({
  billId: z.uuid("議案の指定が不正です"),
  difficultyLevel: z.enum(VALID_DIFFICULTY_LEVELS, "難易度の指定が不正です"),
  category: z
    .enum(ARTICLE_REPORT_CATEGORIES, "種類の指定が不正です")
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, "内容を入力してください")
    .max(
      ARTICLE_REPORT_BODY_MAX_LENGTH,
      `内容は${ARTICLE_REPORT_BODY_MAX_LENGTH}文字以内で入力してください`
    ),
});

export type ArticleReportInput = z.infer<typeof articleReportInputSchema>;

export type ParseArticleReportInputResult =
  | { ok: true; data: ArticleReportInput }
  | { ok: false; error: string };

export function parseArticleReportInput(
  input: unknown
): ParseArticleReportInputResult {
  const result = articleReportInputSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? "入力内容が不正です",
    };
  }
  return { ok: true, data: result.data };
}

export function hasArticleReportBody(body: string): boolean {
  return body.trim().length > 0;
}
