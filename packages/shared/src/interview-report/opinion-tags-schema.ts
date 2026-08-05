import { z } from "zod";
import { REASONING_TYPES } from "./opinion-tags";

/**
 * 意見タグの判定基準。**ここが唯一の正本**。
 *
 * 同じ列を埋める経路が2つある（インタビュー完了時のライブ生成と、既存意見への
 * タグ付けバックフィル）。基準を各プロンプトに手書きすると片方だけ育って、
 * 同じ列に違う粒度のデータが混ざる。zod の describe とプロンプト本文の両方が
 * ここを参照する。
 */
export const OPINION_TAG_CRITERIA = {
  concern:
    "不安・心配・リスク指摘の要点を20-50字で書く。懸念を含まない意見なら null",
  proposal: [
    "具体的な要望・提案の要点を20-50字で、主語と動詞を明確にして書く。提案を含まない意見なら null",
    "**発言者が明示的に述べた要望のみを対象にする。** 体験談・観察・状況説明を「〜すべき」という提案に変換しない",
    "**発言者が使った言葉の強さを超えた表現に置き換えない**（「連携してほしい」を「一元化」に格上げしない）",
  ].join("\n"),
  reasoningTypes: [
    "その意見が何を根拠にしているか（複数可）",
    "- `personal_experience`: 自分自身の体験",
    "- `family_observation`: 家族・身近な人の観察",
    "- `professional_expertise`: 職業・専門分野の知見。**発言者が職業上の経験や専門分野の知識を根拠として示した場合のみ付ける（肩書だけを理由に付けない）**",
    "- `research_reference`: 研究・論文・統計の引用",
    "- `overseas_example`: 海外事例への言及",
    "- `intuition`: 直感・「なんとなく」",
    "- `none`: 根拠の明示なし。根拠が読み取れなければ `[\"none\"]` を返す",
  ].join("\n"),
} as const;

/**
 * 意見タグの zod shape。
 * ライブのレポート生成（opinionSchema に相乗り）と、既存意見へのタグ付けバックフィル
 * （タグだけを生成する専用スキーマ）の両方で同じ定義を使う。
 *
 * 3フィールドとも `.nullable()`（キーの存在は要求し、値として null を許す）。
 * ライブ生成はインタビュー完了の本経路なので、値が取れなかったケースを検証エラーに
 * せず null で通す。保存時に null は正規化する。
 */
export const opinionTagsShape = {
  concern: z.string().nullable().describe(OPINION_TAG_CRITERIA.concern),
  proposal: z.string().nullable().describe(OPINION_TAG_CRITERIA.proposal),
  reasoning_types: z
    .array(z.enum(REASONING_TYPES))
    .nullable()
    .describe(OPINION_TAG_CRITERIA.reasoningTypes),
} as const;

/** タグ付けバックフィルの出力スキーマ（意見ごとに opinion_index で対応付ける）。 */
export const opinionTagsExtractionSchema = z.object({
  tags: z.array(
    z.object({
      opinion_index: z
        .number()
        .int()
        .min(0)
        .describe("対象の意見番号（入力で提示した index をそのまま返す）"),
      ...opinionTagsShape,
    })
  ),
});

export type OpinionTagsExtraction = z.infer<typeof opinionTagsExtractionSchema>;
