import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

export type MiraiStance = Database["public"]["Tables"]["mirai_stances"]["Row"];
export type StanceTypeEnum = Database["public"]["Enums"]["stance_type_enum"];

// フォーム入力用の型とスキーマ
export const stanceInputSchema = z.object({
  type: z
    .enum([
      "for",
      "against",
      "neutral",
      "conditional_for",
      "conditional_against",
      "considering",
      "continued_deliberation",
    ] as const)
    .refine((val) => val !== undefined, {
      message: "スタンスを選択してください",
    }),
  comment: z.string().optional(),
});

export type StanceInput = z.infer<typeof stanceInputSchema>;

// ラベルの定義
export const STANCE_TYPE_LABELS: Record<StanceTypeEnum, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
  conditional_for: "条件付き賛成",
  conditional_against: "条件付き反対",
  considering: "検討中",
  continued_deliberation: "継続審査中",
};
