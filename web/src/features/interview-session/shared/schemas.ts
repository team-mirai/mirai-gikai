import { z } from "zod";

// 意見スキーマ
const opinionSchema = z.object({
  title: z.string().describe("意見のタイトル（40文字以内）"),
  content: z.string().describe("意見の説明（120文字以内）"),
  source_message_id: z
    .string()
    .nullable()
    .describe("この意見の根拠となるユーザー発言のメッセージID"),
});

// 0-100の情報充実度値（LLMが小数点を返す可能性があるため丸める）
const contentRichnessValueSchema = z
  .number()
  .transform((v) => Math.round(v))
  .pipe(z.number().int().min(0).max(100));

// 情報充実度スキーマ
const contentRichnessSchema = z.object({
  total: contentRichnessValueSchema.describe(
    "総合的な情報充実度（0-100の整数）"
  ),
  clarity: contentRichnessValueSchema.describe(
    "論点の明確さ（0-100）— 議論のポイントがはっきり浮かび上がっているか"
  ),
  specificity: contentRichnessValueSchema.describe(
    "具体性（0-100）— 現場の実感や具体的な事例・数値が得られたか"
  ),
  impact: contentRichnessValueSchema.describe(
    "影響への言及（0-100）— 社会的影響や関係者への影響について情報が得られたか"
  ),
  constructiveness: contentRichnessValueSchema.describe(
    "提案の広がり（0-100）— 課題の指摘に加え、改善の方向性や代替案が含まれているか"
  ),
  reasoning: z.string().describe("上記の根拠を簡潔に説明（100文字以内）"),
});

export type InterviewContentRichness = z.infer<typeof contentRichnessSchema>;

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
        "インタビュイーの立場タイプ（subject_expert:専門的な有識者, work_related:業務に関係, daily_life_affected:暮らしに影響, general_citizen:一般的な関心）"
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
    content_richness: contentRichnessSchema.describe(
      "インタビューの情報充実度評価"
    ),
  })
  .strict();

export type InterviewReportData = z.infer<typeof interviewReportSchema>;

// クライアント表示用の型（content_richnessはユーザーには表示しない）
export type InterviewReportViewData = Omit<
  InterviewReportData,
  "content_richness"
>;

// ステージ遷移の型
export const interviewStageSchema = z.enum([
  "chat",
  "summary",
  "summary_complete",
]);
export type InterviewStage = z.infer<typeof interviewStageSchema>;

// 通常チャット用スキーマ（LLM出力用 - next_stageを含む）
export const interviewChatTextSchema = z.object({
  text: z.string(),
  quick_replies: z.array(z.string()).nullable(),
  question_id: z.string().nullable(),
  topic_title: z.string().nullable(),
  next_stage: interviewStageSchema.describe(
    "インタビューのステージ遷移判定。chat=インタビュー継続、summary=要約フェーズへ移行"
  ),
});

export type InterviewChatText = z.infer<typeof interviewChatTextSchema>;

// summaryフェーズ用スキーマ（LLM出力用 - next_stageを含む）
// chat遷移時はreportを省略できるようoptionalにしている
export const interviewChatWithReportSchema = z.object({
  text: z.string(),
  report: interviewReportSchema
    .optional()
    .describe(
      "インタビュー内容をまとめたレポート。next_stageがchatの場合は省略すること"
    ),
  next_stage: interviewStageSchema.describe(
    "ステージ遷移判定。summary=レポート修正継続、summary_complete=レポート完了、chat=インタビュー再開"
  ),
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
