import { z } from "zod";
import { contentRichnessResultSchema } from "../content-richness/schemas";

// 意見スキーマ（web のライブ生成と admin の再抽出バックフィルで共通利用）
export const opinionSchema = z
  .object({
    title: z.string().describe("意見のタイトル（40文字以内）"),
    content: z.string().describe("意見の説明（120文字以内）"),
    source_message_id: z
      .string()
      .nullable()
      .describe("この意見の根拠となるユーザー発言のメッセージID"),
    // ユーザー向けトピック分析で公開表示する文脈込み引用（§4.0）
    contextual_quote: z
      .string()
      .nullable()
      .describe(
        "source_message_id が指すユーザー発言からの逐語引用のみ。言い換え・要約・複数発言の結合・語句の補完をしない。文脈が必要な場合のみ先頭に「（○○について）」を付けてよいが、引用本体は原文ママとする。個人名などの固有名詞は含めない。適切な逐語引用が切り出せなければ null"
      ),
    bill_sentiment: z
      .enum(["期待", "懸念"])
      .nullable()
      .describe(
        "この意見が法案に対して示す期待か懸念か。どちらでもなければ null"
      ),
  })
  .strict();

// レポート生成結果のバリデーション
export const interviewReportSchema = z
  .object({
    summary: z
      .string()
      .nullable()
      .describe(
        "ユーザーの主張を100文字程度でまとめたもの。「」書きで書けるようなテキスト（ただし「」は記載しない）"
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
        "インタビュイーの立場タイプ（subject_expert:専門的な有識者, work_related:業務に関係, daily_life_affected:暮らしに影響, general_citizen:一般的な関心）。ログ内に根拠のある立場のみを用い（発言にない立場を推測で付与しない）、過去の経歴と現在の立場は区別する"
      ),
    role_description: z
      .string()
      .nullable()
      .describe(
        "ユーザーの役割や背景についての詳細な説明。ログ内の本人発言のみを根拠にし、根拠があれば具体的な経歴・専門性を書いてよい。ただし過去の経歴は「元〜」「〜した経験がある」のように現在の立場と誤読されない表現にする"
      ),
    role_title: z
      .string()
      .max(10)
      .nullable()
      .describe(
        "ユーザーの役割を10文字以内で端的に表現したタイトル（例: 物流業者、主婦、教師）。発言に根拠のある具体的な立場を表し、過去の職歴を現在の職業のように表記しない（過去の職歴なら「元〜」を付ける。例: 元復興関係職員）"
      ),
    opinions: z
      .array(opinionSchema)
      .max(3)
      .describe(
        "ユーザーの具体的な主張（最大3件）。議案を検討する人にとって示唆として有益な順（具体性・建設性・独自性が高い順）に並べ、先頭ほど有益・重要な主張とする。ユーザー本人の発言のみを根拠にし、インタビュアーの発言・言い換え・提示情報をユーザーの意見として記載しない。本人が明言していない要望・賛成・結論への格上げをしない。元の対話ログにないことは記載しない"
      ),
    content_richness: contentRichnessResultSchema.describe(
      "インタビューの情報充実度評価"
    ),
  })
  .strict();

export type InterviewReportData = z.infer<typeof interviewReportSchema>;

/**
 * interview_report.opinions(JSONB) に格納されている意見の形。
 * source_message_content など派生フィールドは無視する。
 */
export type InterviewOpinionSource = {
  title: string;
  content: string;
  source_message_id?: string | null;
  contextual_quote?: string | null;
  bill_sentiment?: string | null;
};
