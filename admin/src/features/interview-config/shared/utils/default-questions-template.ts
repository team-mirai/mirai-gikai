import { trimOrNull } from "@/lib/utils/normalize-string";
import type { InterviewQuestionInput } from "../types";

/**
 * LLM で法案ごとに全文生成する質問のスロット。
 * これらの質問は `question` / `follow_up_guide` / `quick_replies` すべてを
 * 法案内容に合わせて差し替えることを想定している（テンプレはサンプル扱い）。
 *
 * - q1: 関心のあるテーマの選択
 * - q2: 立場・関わり方の選択
 */
export type GeneratedQuestionSlot = "q1" | "q2";

/**
 * 固定質問（テンプレートそのまま使う）の定義
 */
export type FixedQuestionTemplate = {
  kind: "fixed";
  question: string;
  follow_up_guide: string;
  quick_replies?: string[];
};

/**
 * LLM 生成質問（スロット）の定義。
 * `sample_*` は LLM へのサンプルとして渡し、出力もこの形式に寄せる。
 */
export type GeneratedQuestionTemplate = {
  kind: "generated";
  slot: GeneratedQuestionSlot;
  /** サンプルの質問文（LLM への参考として渡す） */
  sample_question: string;
  /** サンプルのフォローアップ指針 */
  sample_follow_up_guide: string;
  /** サンプルのクイックリプライ */
  sample_quick_replies: string[];
};

export type DefaultQuestionTemplateEntry =
  | FixedQuestionTemplate
  | GeneratedQuestionTemplate;

/**
 * インタビュー質問テンプレート（7問固定）
 *
 * - Q1: 関心のあるテーマ選択（法案ごとに LLM で全文生成）
 * - Q2: 立場・関わり方（法案ごとに LLM で全文生成）
 * - Q3, Q4, Q5, Q6, Q7: 固定文言
 */
export const DEFAULT_QUESTIONS_TEMPLATE: readonly DefaultQuestionTemplateEntry[] =
  [
    {
      kind: "generated",
      slot: "q1",
      sample_question:
        "今回の法改正のうち、あなたが特に関係がある、または意見を伝えたいテーマを選んでください。",
      sample_follow_up_guide:
        "選んだテーマはQ5で深掘りします。ここでは1つに絞ってもらい、迷う場合は「一番関心が強いもの」を選んでもらってください。",
      sample_quick_replies: [
        "AI開発でのデータ利用",
        "同意なしのデータ利用",
        "こどもの個人情報",
        "顔データの扱い",
        "違反時の罰則と救済",
      ],
    },
    {
      kind: "generated",
      slot: "q2",
      sample_question:
        "この法案について、あなたはどんな立場・関わり方に近いですか？",
      sample_follow_up_guide:
        "回答内容から専門知識レベルを判断し、以降の質問の深さや用語の使い方を調整してください。差し支えなければ、具体的な関わり方を一言だけ追加で聞いてください。",
      sample_quick_replies: [
        "仕事で個人情報を扱う",
        "AI・データ分析に関わる",
        "こどもの保護者",
        "顔認証サービスをよく使う",
        "一般市民として関心がある",
      ],
    },
    {
      kind: "fixed",
      question: "今回の法案について、現時点でどの程度ご存知ですか。",
      follow_up_guide:
        "回答内容から専門知識レベルを判断し、以降の質問の深さや用語の使い方を調整してください。理解度が高くない場合は、以降の質問で制度名を出す前に短い要約を挟んでください。",
      quick_replies: [
        "よく知っている",
        "概要は知っている",
        "聞いたことはある",
        "ほとんど知らない",
      ],
    },
    {
      kind: "fixed",
      question: "今回の法案について、全体としてどのように評価していますか。",
      follow_up_guide:
        "評価の理由を1点だけ具体例で聞いてください。賛否が割れる場合は、どの論点が評価を左右したかを確認してください。",
      quick_replies: [
        "良いと思う",
        "どちらかといえば良い",
        "どちらともいえない",
        "どちらかといえば良くない",
        "良くない",
        "わからない",
      ],
    },
    {
      kind: "fixed",
      question:
        "Q1で選んだテーマについて、なぜ／どのような点が気になりますか？具体的に教えてください。",
      follow_up_guide:
        "Q1で選んだテーマに即して具体化してもらってください。「どんな場面を想像したか」「どの立場での懸念か」などで深掘りできます。",
    },
    {
      kind: "fixed",
      question: "その点が気になるのはなぜですか。",
      follow_up_guide:
        "背景にある経験や価値観を具体化してください。必要なら「どんな場面を想像したか」を聞いてください。",
    },
    {
      kind: "fixed",
      question:
        "最後に、この制度を設計する人に、何か一つ伝えるとしたらそれは何ですか？",
      follow_up_guide:
        "要望・条件・優先順位のどれかに整理してもらうと具体化します。可能なら「それが実現したら評価はどう変わるか」を最後に確認してください。",
    },
  ];

/**
 * LLM による生成質問のスロット入力
 */
export type GeneratedQuestionInput = {
  question?: string;
  follow_up_guide?: string;
  quick_replies?: string[];
};

/**
 * テンプレートと LLM 生成結果を合成して質問配列を組み立てる。
 *
 * 生成スロット（Q1/Q2）に LLM 応答が入っていればそれを使い、
 * 入っていなければサンプル値でフォールバックする。
 * 固定質問はテンプレートそのまま。
 */
export function buildQuestionsFromTemplate(params: {
  q1?: GeneratedQuestionInput;
  q2?: GeneratedQuestionInput;
}): InterviewQuestionInput[] {
  const { q1, q2 } = params;

  return DEFAULT_QUESTIONS_TEMPLATE.map((entry) => {
    if (entry.kind === "fixed") {
      const out: InterviewQuestionInput = {
        question: entry.question,
        follow_up_guide: entry.follow_up_guide,
      };
      if (entry.quick_replies && entry.quick_replies.length > 0) {
        out.quick_replies = [...entry.quick_replies];
      }
      return out;
    }

    const input = entry.slot === "q1" ? q1 : q2;
    const question = trimOrNull(input?.question) ?? entry.sample_question;
    const followUp =
      trimOrNull(input?.follow_up_guide) ?? entry.sample_follow_up_guide;
    const replies =
      input?.quick_replies?.filter((r) => r.trim().length > 0) ?? [];
    const finalReplies =
      replies.length > 0 ? replies : entry.sample_quick_replies;

    return {
      question,
      follow_up_guide: followUp,
      quick_replies: [...finalReplies],
    };
  });
}
