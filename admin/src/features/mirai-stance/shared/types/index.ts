import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

export type MiraiStance = Database["public"]["Tables"]["mirai_stances"]["Row"];
export type StanceTypeEnum = Database["public"]["Enums"]["stance_type_enum"];

// 補足情報（見出し + Markdown 本文）
const stanceSupplementSchema = z.object({
  title: z.string(),
  body: z.string().describe("Markdown"),
});

// 公開確認日（JST の YYYY-MM-DD）
export const publishReviewDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で指定してください");

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
  // 旧フォーマットの判断の理由（自由記述）
  comment: z.string().optional(),
  // 新フォーマット: 判断の理由（一言）・箇条書き・補足情報。
  // undefined は既存の値を変更しない
  reasonSummary: z.string().optional(),
  reasonPoints: z.array(z.string()).optional(),
  supplements: z.array(stanceSupplementSchema).optional(),
  // 賛否・コメントの公開日時（ISO 8601、タイムゾーン付き）。
  // null は即時公開、undefined は既存の公開日時を変更しない
  publishAt: z.string().datetime({ offset: true }).nullable().optional(),
  // 賛否・判断の理由の公開/非公開。false にすると公開日時もリセット（null）する。
  // undefined は既存の値を変更しない
  isPublished: z.boolean().optional(),
  // 公開確認日（JST の YYYY-MM-DD）。非公開の賛否について、この日以降に
  // Slack で政調会長へ公開確認を出す。null で解除、undefined は既存の値を変更しない
  publishReviewDate: publishReviewDateSchema.nullable().optional(),
});

export type StanceInput = z.infer<typeof stanceInputSchema>;

// 管理画面フォーム用。公開日時は datetime-local の日本時間（空文字は即時公開）で持つ。
// 箇条書きは useFieldArray で扱うためオブジェクトの配列にする
export const stanceFormSchema = stanceInputSchema
  .omit({
    publishAt: true,
    isPublished: true,
    publishReviewDate: true,
    reasonPoints: true,
    supplements: true,
  })
  .extend({
    isPublished: z.boolean(),
    publishAtLocal: z.string(),
    // 公開確認日（date 入力の YYYY-MM-DD。空文字は未設定）
    publishReviewDate: z.string(),
    reasonPoints: z.array(z.object({ value: z.string() })),
    supplements: z.array(stanceSupplementSchema),
  });

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
