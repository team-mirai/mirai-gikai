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
      "free_vote",
    ] as const)
    .refine((val) => val !== undefined, {
      message: "スタンスを選択してください",
    }),
  comment: z.string().optional(),
  // 賛否・コメントの公開日時（ISO 8601、タイムゾーン付き）。
  // null は即時公開、undefined は既存の公開日時を変更しない
  publishAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type StanceInput = z.infer<typeof stanceInputSchema>;

// 管理画面フォーム用。公開日時は datetime-local の日本時間（空文字は即時公開）で持つ
export const stanceFormSchema = stanceInputSchema
  .omit({ publishAt: true })
  .extend({ publishAtLocal: z.string() });

export type StanceFormValues = z.infer<typeof stanceFormSchema>;

// ラベルの定義
export const STANCE_TYPE_LABELS: Record<StanceTypeEnum, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
  conditional_for: "条件付き賛成",
  conditional_against: "条件付き反対",
  considering: "検討中",
  continued_deliberation: "継続審査中",
  free_vote: "自由投票",
};
