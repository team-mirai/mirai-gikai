import { z } from "zod";

// 意見スキーマ
const opinionSchema = z.object({
  title: z.string().describe("意見のタイトル（40文字以内）"),
  content: z.string().describe("意見の説明（120文字以内）"),
});

// 0-100のスコア（LLMが小数点を返す可能性があるため丸める）
const scoreValueSchema = z
  .number()
  .transform((v) => Math.round(v))
  .pipe(z.number().int().min(0).max(100));

// スコアリングスキーマ
const scoresSchema = z.object({
  total: scoreValueSchema.describe("総合スコア（0-100の整数）"),
  clarity: scoreValueSchema.describe(
    "主張の明確さ（0-100）- 意見や立場が明確に表現されているか"
  ),
  specificity: scoreValueSchema.describe(
    "具体性（0-100）- 実務経験に基づく具体的な事例や数値が含まれているか"
  ),
  impact: scoreValueSchema.describe(
    "影響度（0-100）- 法案が与える社会的影響や関係者への影響について言及があるか"
  ),
  constructiveness: scoreValueSchema.describe(
    "建設性（0-100）- 問題点の指摘だけでなく、改善案や代替案の提示があるか"
  ),
  reasoning: z.string().describe("スコアの根拠を簡潔に説明（100文字以内）"),
});

export type InterviewScores = z.infer<typeof scoresSchema>;

// レポート生成結果のバリデーション
export const interviewReportSchema = z
  .object({
    summary: z
      .string()
      .nullable()
      .describe(
        "ユーザーの主張を40文字以内でまとめたもの。「」書きで書けるようなテキスト（ただし「」は記載しない）"
      ),
    stance: z
      .enum(["for", "against", "neutral"])
      .nullable()
      .describe(
        "法案に対するユーザーのスタンス。for=賛成、against=反対、neutral=期待と懸念の両方がある"
      ),
    role: z
      .enum([
        "subject_expert",
        "work_related",
        "daily_life_affected",
        "general_citizen",
      ])
      .nullable()
      .describe(
        "インタビュイーの立場タイプ（subject_expert:専門的な有識者, work_related:業務に関係, daily_life_affected:暮らしに影響, general_citizen:一市民として関心）"
      ),
    role_description: z
      .string()
      .nullable()
      .describe("ユーザーの役割や背景についての詳細な説明"),
    role_title: z
      .string()
      .max(10)
      .nullable()
      .describe(
        "ユーザーの役割を10文字以内で端的に表現したタイトル（例: 物流業者、主婦、教師）"
      ),
    opinions: z
      .array(opinionSchema)
      .max(3)
      .describe(
        "ユーザーの具体的な主張（最大3件）。メインの主張を補強する内容を最低1つは含める。元の対話ログにないことは記載しない"
      ),
    scores: scoresSchema.describe(
      "インタビューを「法案検討の参考資料」として評価したスコア"
    ),
  })
  .strict();

export type InterviewReportData = z.infer<typeof interviewReportSchema>;

// クライアント表示用の型（scoresはユーザーには表示しない）
export type InterviewReportViewData = Omit<InterviewReportData, "scores">;

// ステージ遷移の型
export const interviewStageSchema = z.enum([
  "chat",
  "summary",
  "summary_complete",
]);
export type InterviewStage = z.infer<typeof interviewStageSchema>;

// 通常チャット用スキーマ（LLM出力用）
export const interviewChatTextSchema = z.object({
  text: z.string(),
  quick_replies: z.array(z.string()).nullable(),
  question_id: z.string().nullable(),
  topic_title: z.string().nullable(),
  next_stage: interviewStageSchema,
});

export type InterviewChatText = z.infer<typeof interviewChatTextSchema>;

// summaryフェーズ用スキーマ（LLM出力用）
export const interviewChatWithReportSchema = z.object({
  text: z.string(),
  report: interviewReportSchema,
  next_stage: interviewStageSchema,
});

export type InterviewChatWithReport = z.infer<
  typeof interviewChatWithReportSchema
>;

// クライアント側で使う統一スキーマ（両方のレスポンスを受け取れる）
export const interviewChatResponseSchema = z.object({
  text: z.string(),
  report: interviewReportSchema.optional(),
  quick_replies: z.array(z.string()).optional().nullable(),
  question_id: z.string().optional().nullable(),
  topic_title: z.string().optional().nullable(),
  next_stage: interviewStageSchema.optional(),
});

export type InterviewChatResponse = z.infer<typeof interviewChatResponseSchema>;
