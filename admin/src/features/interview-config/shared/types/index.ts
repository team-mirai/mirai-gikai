import { PROMPT_SECTION_MAX_LENGTH } from "@mirai-gikai/shared/interview-prompts/sections";
import { INTERVIEW_MODES } from "@mirai-gikai/shared/interview-prompts/types";
import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";
import { isValidChatModel } from "../utils/chat-model-options";

// Database types
export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];
export type InterviewConfigInsert =
  Database["public"]["Tables"]["interview_configs"]["Insert"];
export type InterviewConfigUpdate =
  Database["public"]["Tables"]["interview_configs"]["Update"];

export type InterviewQuestion =
  Database["public"]["Tables"]["interview_questions"]["Row"];
export type InterviewQuestionInsert =
  Database["public"]["Tables"]["interview_questions"]["Insert"];
export type InterviewQuestionUpdate =
  Database["public"]["Tables"]["interview_questions"]["Update"];

/**
 * プロンプトの節ごとの上書き。フォームは選択中のモードぶんだけを扱う。
 *
 * 空欄はコード側の既定値を使うという意味なので、必須にはしない。
 * キーは EDITABLE_PROMPT_SECTION_KEYS と一致させる必要があり、
 * ずれは prompt-overrides-schema.test.ts が検出する。
 */
const promptSectionSchema = z
  .string()
  .max(
    PROMPT_SECTION_MAX_LENGTH,
    `1つの節は${PROMPT_SECTION_MAX_LENGTH}文字以内で入力してください`
  )
  .optional();

const promptSectionsSchema = z.object({
  cautions: promptSectionSchema,
  stopCriteria: promptSectionSchema,
});

/**
 * モードごとの上書き。フォームは全モードぶんを保持する。
 *
 * 1モードぶんだけ持つと、モードを切り替えたときに画面の文面が切り替わらず、
 * そのまま保存すると切り替え先の文面を潰す。
 */
export const promptOverridesSchema = z.object({
  loop: promptSectionsSchema.optional(),
  bulk: promptSectionsSchema.optional(),
  targeted: promptSectionsSchema.optional(),
});

export { PROMPT_SECTION_MAX_LENGTH };

export type PromptOverridesInput = z.infer<typeof promptOverridesSchema>;

// バリデーションスキーマ
export const interviewConfigSchema = z.object({
  name: z
    .string()
    .min(1, "設定名は必須です")
    .max(100, "設定名は100文字以内で入力してください"),
  status: z.enum(["public", "closed"]),
  mode: z.enum(INTERVIEW_MODES),
  themes: z.array(z.string().min(1)).optional(),
  chat_model: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || isValidChatModel(val), {
      message: "無効なAIモデルが指定されています",
    }),
  estimated_duration: z
    .number()
    .int("整数で入力してください")
    .min(1, "1分以上で設定してください")
    .max(180, "180分以内で設定してください")
    .nullable()
    .optional(),
  prompt_overrides: promptOverridesSchema.optional(),
});

export const interviewQuestionSchema = z.object({
  question: z
    .string()
    .min(1, "質問文は必須です")
    .max(1000, "質問文は1000文字以内で入力してください"),
  follow_up_guide: z
    .string()
    .max(2000, "フォローアップ指針は2000文字以内で入力してください")
    .optional(),
  quick_replies: z.array(z.string().min(1)).optional(),
  target_audience: z
    .string()
    .max(500, "対象者条件は500文字以内で入力してください")
    .optional(),
});

export const interviewQuestionsInputSchema = z.array(interviewQuestionSchema);

// 型定義
export type InterviewConfigInput = z.infer<typeof interviewConfigSchema>;
export type InterviewQuestionInput = z.infer<typeof interviewQuestionSchema>;
export type InterviewQuestionsInput = z.infer<
  typeof interviewQuestionsInputSchema
>;

export { arrayToText, textToArray } from "../utils/array-text-conversion";
