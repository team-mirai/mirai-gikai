import { z } from "zod";
import { AI_MODELS, type AiModel } from "@/lib/ai/models";
import { MAX_PERSONA_SLOTS } from "./constants";

/**
 * 外部入力の長さ上限（prompt injection / DoS 耐性の defensive limit）。
 * LLM prompt に埋め込まれる or DB からの往復に関わるフィールドは必ず
 * いずれかの上限に揃える。
 */
const ID_MAX = 100;
const SHORT_TEXT_MAX = 200;
const MEDIUM_TEXT_MAX = 2_000;
const LONG_TEXT_MAX = 40_000;
const SMALL_ARRAY_MAX = 20;
const MEDIUM_ARRAY_MAX = 50;

/**
 * ペルソナ生成 LLM の出力スキーマ
 *
 * 過去レポート（summary / stance / role / opinions / 会話）から
 * インタビュイー LLM の system prompt を組み立てるための構造化データを抽出する。
 */
// LLM 出力スキーマでは .max() / .min() を hard validation に使わない（learning）。
// LLM は文字数や件数を厳密に守れず、超過/不足で generateObject が ZodError で
// 落ちると pipeline 全体が失敗するため、件数・長さは .describe() で soft 指示する。
// 例外: 構造的に「最低 1 件必要」(.min(1)) は欠落時に下流が壊れるので残す。
export const personaSchema = z.object({
  role_title: z
    .string()
    .min(1)
    .describe("立場の短縮タイトル（例: 教師、物流業者。40 文字以内目安）"),
  role_description: z
    .string()
    .describe(
      "立場・属性の詳細説明。元レポートの role_description を引き継ぎつつ、シミュ用に補強"
    ),
  stance: z
    .enum(["for", "against", "neutral"])
    .describe("法案へのスタンス。元レポートと一致させる"),
  knowledge_level: z
    .enum(["beginner", "intermediate", "expert"])
    .describe("法案に関する事前知識レベル。会話の語彙から推定"),
  speaking_style: z
    .string()
    .describe(
      "話し方の特徴（例: 短く端的に答える、丁寧で長めに語る、業界用語を使うなど）"
    ),
  background: z
    .string()
    .describe(
      "ペルソナのバックグラウンドストーリー。なぜこの立場・スタンスを取るのかが伝わる短い説明（200文字以内目安）"
    ),
  key_concerns: z
    .array(z.string())
    .min(1)
    .describe("このペルソナが法案について特に気にしている論点。3〜5 件目安"),
  typical_response_length: z
    .enum(["short", "medium", "long"])
    .describe(
      "回答の長さ傾向。short=15文字以下中心、medium=数十文字、long=数行"
    ),
  boundaries: z
    .array(z.string())
    .describe(
      "ペルソナが拒否・回避する話題や前提。例: 「仮定の質問は答えにくい」「個人情報は話せない」など。なければ空配列。5 件以内目安"
    ),
  message_to_politicians: z
    .array(z.string())
    .min(1)
    .describe(
      "このペルソナが今回の法案に関して政治家へ最終的に伝えたい核心メッセージを 3〜5 件目安の箇条書きで（1 項目ずつ簡潔に 1 文）。" +
        "後段の満足度評価が「項目ごとに引き出せたか」を判定するため、項目は意味的に独立させる。" +
        "抽象論ではなく、スタンスの根拠＋具体的な懸念/要望を含むこと。"
    ),
});

export type PersonaCharacterSheet = z.infer<typeof personaSchema>;

/**
 * インタビュイーの満足度評価（シミュ完了後に LLM に付与させる）。
 * persona.message_to_politicians が transcript でどの程度引き出されたかを判定する。
 */
export const intervieweeSatisfactionSchema = z
  .object({
    score: z
      .number()
      .int()
      .min(1)
      .max(5)
      .describe(
        "満足度スコア（1〜5）。" +
          "5=伝えたかったことがほぼ網羅的に引き出された / " +
          "4=主要な点は伝わったが細部で掘り残しあり / " +
          "3=半分くらい伝わったが重要な論点が残っている / " +
          "2=ほとんど伝えられなかった / " +
          "1=話したい内容に全く触れず終わった"
      ),
    message_coverage: z
      .enum(["covered", "partial", "not_covered"])
      .describe(
        "message_to_politicians の網羅度: covered=ほぼ網羅 / partial=一部のみ / not_covered=ほぼ未達"
      ),
    summary: z
      .string()
      .describe(
        "スコアの根拠を 2〜3 文で説明。どの論点が引き出され、どこが残ったかを簡潔に。"
      ),
    uncovered_points: z
      .array(z.string())
      .describe(
        "message_to_politicians のうち、インタビューで十分引き出されなかったポイント（あれば箇条書き、なければ空配列）"
      ),
  })
  .strict();

export type IntervieweeSatisfaction = z.infer<
  typeof intervieweeSatisfactionSchema
>;

/**
 * 全ペルソナの満足度を総合的に評価する LLM 出力のスキーマ。
 * 1 回の複数ペルソナシミュ全体に対して 1 件生成される。
 */
export const overallEvaluationSchema = z
  .object({
    verdict: z
      .enum(["excellent", "good", "fair", "poor"])
      .describe(
        "総合評価。excellent=どのペルソナも十分に伝えられた / good=主要な論点は概ねカバー / fair=一部ペルソナで掘り残しあり / poor=多くのペルソナで伝えきれない"
      ),
    summary: z
      .string()
      .describe(
        "このインタビュー設定が複数のペルソナの伝えたいことをどれくらい引き出せたかを 2〜4 文で総括"
      ),
    common_strengths: z
      .array(z.string())
      .describe(
        "複数のペルソナで共通して引き出せた点・インタビュー設定の強み（3〜5 件目安）"
      ),
    common_gaps: z
      .array(z.string())
      .describe(
        "複数のペルソナで共通して取りこぼされた論点・改善余地（3〜5 件目安。なければ空配列）"
      ),
    improvement_suggestions: z
      .array(z.string())
      .describe(
        "インタビュー設定（質問 / テーマ / 深掘り方針）への具体的な改善提案（3〜5 件目安。改善余地がなければ空配列）"
      ),
  })
  .strict();

export type OverallEvaluation = z.infer<typeof overallEvaluationSchema>;

/**
 * 多様性プランナー LLM の出力スキーマ。
 *
 * roleHint 未指定の bill スロットが複数あるとき、各スロットに割り当てる
 * 「多様な当事者像」を 1 回の LLM 呼び出しでまとめて計画する。
 * 出力配列の順序は、入力の slotsToplan の順序に対応する。
 */
export const diverseRolesPlanSchema = z.object({
  // .max() は付けない（LLM 出力で hard validation を避ける学習）。
  // 件数の一致は呼び出し側で runtime チェックする。
  roles: z
    .array(
      z.object({
        role_hint: z
          .string()
          .min(1)
          .describe(
            "1 人の当事者像を端的に示す役割ヒント。例: 「都内の高校教師」「中小製造業の経営者」。抽象的な「一般市民」は避ける"
          ),
        stance: z
          .enum(["for", "against", "neutral"])
          .describe(
            "この当事者像が法案に対して取りそうな自然なスタンス。役割と矛盾しない範囲で"
          ),
        rationale: z
          .string()
          .describe(
            "なぜこの当事者をインタビュー対象に選んだか、法案との接点を 1〜2 文で"
          ),
      })
    )
    .min(1)
    .describe("入力の slotsToplan と同じ件数・同じ順序で返すこと"),
});

export type DiverseRolesPlan = z.infer<typeof diverseRolesPlanSchema>;

/**
 * シミュレーションの Summary フェーズで LLM に生成させるレポートのスキーマ。
 * web 本番の interviewReportSchema と互換（シミュ用の定義）。
 *
 * content_richness は本番では別ステップで算出するため、シミュでは出力させない簡易版。
 */
export const simGeneratedReportSchema = z
  .object({
    summary: z
      .string()
      .nullable()
      .describe("ユーザーの主張を 100 文字程度でまとめたもの"),
    stance: z
      .enum(["for", "against", "neutral"])
      .nullable()
      .describe("法案へのスタンス"),
    role: z
      .enum([
        "subject_expert",
        "work_related",
        "daily_life_affected",
        "general_citizen",
      ])
      .nullable()
      .describe("インタビュイーの立場タイプ"),
    role_description: z
      .string()
      .nullable()
      .describe("ユーザーの役割や背景の詳細説明"),
    role_title: z
      .string()
      .max(10)
      .nullable()
      .describe("役割を 10 文字以内で端的に表現したタイトル"),
    opinions: z
      .array(
        z
          .object({
            title: z.string().describe("意見のタイトル（40 文字以内）"),
            content: z.string().describe("意見の説明（120 文字以内）"),
          })
          .strict()
      )
      .max(3)
      .describe("ユーザーの具体的主張（最大 3 件）"),
  })
  .strict();

export type SimGeneratedReport = z.infer<typeof simGeneratedReportSchema>;

/**
 * シミュレートされた 1 ターン
 */
export const simulatedTurnSchema = z
  .object({
    role: z.enum(["interviewer", "interviewee"]),
    content: z.string(),
    topic_title: z.string().nullable().optional(),
    question_id: z.string().nullable().optional(),
    next_stage: z
      .enum(["chat", "summary", "summary_complete"])
      .nullable()
      .optional(),
    /** インタビュアーがそのターンで提示した選択肢。なければ null */
    quick_replies: z.array(z.string()).nullable().optional(),
  })
  .strict();

export type SimulatedTurn = z.infer<typeof simulatedTurnSchema>;

/**
 * AI_MODELS の値のみを許可する zod スキーマ。
 * 未知のモデル ID を弾くため、値集合を runtime で検査する。
 */
const aiModelSchema = z.custom<AiModel>(
  (val): val is AiModel =>
    typeof val === "string" &&
    (Object.values(AI_MODELS) as string[]).includes(val),
  { message: "Unknown AI model id" }
);

/**
 * 複数ペルソナシミュのリクエスト内で、各スロットを表すスキーマ。
 */
const personaSlotInputSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("report"),
      reportId: z.string().min(1).max(ID_MAX),
    })
    .strict(),
  z
    .object({
      kind: z.literal("bill"),
      stanceHint: z.enum(["for", "against", "neutral"]).optional(),
      // 空文字 / 空白のみの roleHint は「未指定」として扱う必要があるが、
      // .optional() だけだと "" が「指定あり」と解釈されて planner の
      // fallback を殺してしまう。trim して空なら undefined にそろえる
      roleHint: z
        .string()
        .max(SHORT_TEXT_MAX)
        .optional()
        .transform((v) => {
          const trimmed = v?.trim();
          return trimmed && trimmed.length > 0 ? trimmed : undefined;
        }),
    })
    .strict(),
]);

/** 複数ペルソナシミュ API のリクエストボディ（実行時バリデーション用） */
export const multiSimulationRunRequestSchema = z
  .object({
    billId: z.string().min(1).max(ID_MAX),
    personaSlots: z
      .array(personaSlotInputSchema)
      .min(1, "ペルソナを 1 件以上選択してください")
      .max(MAX_PERSONA_SLOTS, `ペルソナは最大 ${MAX_PERSONA_SLOTS} 件までです`),
    improvedConfig: z
      .object({
        mode: z.enum(["loop", "bulk"]),
        themes: z
          .array(z.string().max(MEDIUM_TEXT_MAX))
          .max(SMALL_ARRAY_MAX)
          .nullable(),
        knowledgeSource: z.string().max(LONG_TEXT_MAX).nullable(),
        estimatedDurationMinutes: z.number().int().min(1).max(600).nullable(),
        questions: z
          .array(
            z
              .object({
                id: z.string().min(1).max(ID_MAX),
                question: z.string().min(1).max(MEDIUM_TEXT_MAX),
                quick_replies: z
                  .array(z.string().max(SHORT_TEXT_MAX))
                  .max(SMALL_ARRAY_MAX)
                  .nullable(),
                follow_up_guide: z.string().max(MEDIUM_TEXT_MAX).nullable(),
              })
              .strict()
          )
          .min(1, "改善版 config に質問が 1 件以上必要です")
          .max(MEDIUM_ARRAY_MAX),
      })
      .strict(),
    interviewerModel: aiModelSchema,
    intervieweeModel: aiModelSchema,
    personaModel: aiModelSchema,
  })
  .strict();
