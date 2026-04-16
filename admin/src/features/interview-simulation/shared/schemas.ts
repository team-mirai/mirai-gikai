import { z } from "zod";

/**
 * ペルソナ生成 LLM の出力スキーマ
 *
 * 過去レポート（summary / stance / role / opinions / 会話）から
 * インタビュイー LLM の system prompt を組み立てるための構造化データを抽出する。
 */
export const personaSchema = z
  .object({
    role_title: z
      .string()
      .max(20)
      .describe("立場の短縮タイトル（例: 教師、物流業者）"),
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
        "ペルソナのバックグラウンドストーリー。なぜこの立場・スタンスを取るのかが伝わる短い説明（200文字以内）"
      ),
    key_concerns: z
      .array(z.string())
      .min(1)
      .max(5)
      .describe("このペルソナが法案について特に気にしている論点。3〜5件程度"),
    typical_response_length: z
      .enum(["short", "medium", "long"])
      .describe(
        "回答の長さ傾向。short=15文字以下中心、medium=数十文字、long=数行"
      ),
    boundaries: z
      .array(z.string())
      .max(5)
      .describe(
        "ペルソナが拒否・回避する話題や前提。例: 「仮定の質問は答えにくい」「個人情報は話せない」など。なければ空配列"
      ),
  })
  .strict();

export type PersonaCharacterSheet = z.infer<typeof personaSchema>;

/**
 * Judge による評価軸ごとのスコア
 */
export const judgeCriterionSchema = z
  .object({
    criterion: z.enum([
      "question_diversity",
      "depth_of_followup",
      "flow_naturalness",
      "question_coverage",
      "persona_consistency",
    ]),
    score_current: z
      .number()
      .int()
      .min(1)
      .max(5)
      .describe("現行プロンプトのスコア（1=悪い, 5=非常に良い）"),
    score_improved: z
      .number()
      .int()
      .min(1)
      .max(5)
      .describe("改善版プロンプトのスコア"),
    comment: z.string().describe("差を説明する短いコメント（80文字以内）"),
  })
  .strict();

export type JudgeCriterionResult = z.infer<typeof judgeCriterionSchema>;

/**
 * Judge の総合判定スキーマ
 */
export const judgeVerdictSchema = z
  .object({
    criteria: z
      .array(judgeCriterionSchema)
      .describe("評価軸ごとのスコアとコメント"),
    winner: z
      .enum(["current", "improved", "tie"])
      .describe("総合的にどちらが優れているか"),
    summary: z
      .string()
      .describe("総合所見。改善版の長所と懸念を200文字以内で記述"),
    key_differences: z
      .array(z.string())
      .describe("対比した際の主要な差分（箇条書き、3〜5件）"),
    concerns: z
      .array(z.string())
      .describe("改善版を本番投入する前に確認すべき懸念点。なければ空配列"),
  })
  .strict();

export type JudgeVerdict = z.infer<typeof judgeVerdictSchema>;

/**
 * 改善版 sim の「インタビュアー質問」を、元の実インタビューの
 * インタビュアー質問と比較評価する Judge のスキーマ。
 *
 * 注: インタビュイー側の比較はしない（元は実在人物、sim は合成ペルソナで質が別物）。
 * 比較対象はあくまで "インタビュアーの質問スタイル・深掘り・カバレッジ" に限定する。
 */
export const judgeVsOriginalVerdictSchema = z
  .object({
    overall_verdict: z
      .enum(["improved_better", "about_same", "improved_worse"])
      .describe(
        "改善版のインタビュアー質問が元インタビューと比べて総合的にどうか。improved_better=改善版が勝る / about_same=大きな差はない / improved_worse=改善版が劣る"
      ),
    summary: z
      .string()
      .describe(
        "改善版インタビュアーの良し悪しを 1〜2 段落で要約。元との差が小さければ『大きな差はない』と率直に書く"
      ),
    improved_strengths: z
      .array(z.string())
      .describe(
        "改善版インタビュアーが元より優れている点。箇条書き、3〜5件。なければ空配列"
      ),
    improved_weaknesses: z
      .array(z.string())
      .describe(
        "改善版インタビュアーが元より劣っている点・不自然な点。箇条書き、3〜5件。なければ空配列"
      ),
    notable_observations: z
      .array(z.string())
      .describe(
        "特筆すべき観察点（例: カバレッジに大きな差、特定の深掘り技法の差など）。なければ空配列"
      ),
  })
  .strict();

export type JudgeVsOriginalVerdict = z.infer<
  typeof judgeVsOriginalVerdictSchema
>;

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
