import type { InterviewQuestionInput } from "../types";

/**
 * クイックリプライのみを LLM で法案別に生成するスロット。
 * 質問文・フォローアップ指針は固定文言を使う。
 *
 * - topics: 関心のあるテーマ（論点）選択肢（Q1 で使う）
 * - stance: 立場・関わり方の選択肢（Q2 で使う）
 */
export type QuickRepliesSlot = "topics" | "stance";

/** 「その他（自由記述）」として各スロットの末尾に必ず加える固定選択肢 */
export const OTHER_FREE_TEXT_OPTION = "その他（自由記述）";

/**
 * 深掘り過剰を抑えるため、自由回答系の質問のフォローアップ指針に共通で付与する末尾ルール。
 * 適用先は Q4 / Q5 / Q7。Q6 は許容往復数が 5 と異なるため、本定数を参照せず
 * インラインで独自ルール（最大5往復）を記述している。
 */
export const FOLLOW_UP_DEPTH_LIMIT_RULE =
  "具体的なキーワードを含む回答を得られた場合は深掘りをやめて次の質問に行く。なるべく一度の質問で回答者から具体的な回答を得るようにこころがけ、長々と質問を続けない。回答者とのやりとりは最大3往復までにとどめる。";

export type FixedQuestionTemplate = {
  kind: "fixed";
  question: string;
  follow_up_guide: string;
  quick_replies?: string[];
};

/**
 * クイックリプライのみ法案ごとに LLM 生成するタイプ。
 * 質問文とフォローアップ指針は固定文言。
 */
export type QuickRepliesSlotTemplate = {
  kind: "quick_replies_slot";
  slot: QuickRepliesSlot;
  /** 固定の質問文 */
  question: string;
  /** 固定のフォローアップ指針 */
  follow_up_guide: string;
  /** LLM 生成のサンプル／フォールバック用 */
  sample_quick_replies: string[];
};

export type DefaultQuestionTemplateEntry =
  | FixedQuestionTemplate
  | QuickRepliesSlotTemplate;

/**
 * インタビュー質問テンプレート（7問固定）
 *
 * - Q1, Q2: 質問文・follow_up_guide は固定、quick_replies のみ LLM 生成
 * - Q3, Q4, Q6: 固定の質問と選択肢
 * - Q5, Q7: 固定の質問（自由回答）
 */
export const DEFAULT_QUESTIONS_TEMPLATE: readonly DefaultQuestionTemplateEntry[] =
  [
    {
      kind: "quick_replies_slot",
      slot: "topics",
      question:
        "今回の法改正のうち、あなたが特に関係がある、または意見を伝えたいテーマを選んでください。",
      follow_up_guide:
        "回答で選ばれたテーマを以降の深掘りの前提にしてください。この質問で「その他」以外のクイックリプライの選択肢が選ばれた場合、または「その他（自由記述）」が選ばれ、その内容について記述をもらった場合は、速やかにQ2に進む。「その他」が選ばれた場合は、記事だけでなくナレッジソースの資料も参考にしながら、何の話をしているのか特定する。「その他」が選ばれた場合は、選択肢を限定せず、「ありがとうございます。「その他（自由記述）」とのことですが、どのような点について関心がありますか？」と尋ねる。キーワードを受け取ったら速やかに次の質問にいく。",
      sample_quick_replies: [
        "AI開発でのデータ利用",
        "同意なしのデータ利用",
        "こどもの個人情報",
        "顔データの扱い",
        "違反時の罰則と救済",
        OTHER_FREE_TEXT_OPTION,
      ],
    },
    {
      kind: "quick_replies_slot",
      slot: "stance",
      question: "この法案について、あなたはどんな立場・関わり方に近いですか？",
      follow_up_guide:
        "回答内容から専門知識レベルを判断し、以降の質問の深さや用語の使い方を調整してください。この質問で「その他」以外のクイックリプライの選択肢が選ばれた場合、または「その他（自由記述）」が選ばれ、その内容について記述をもらった場合は、速やかにQ3に進む。",
      sample_quick_replies: [
        "仕事で個人情報を扱う",
        "AI・データ分析に関わる",
        "こどもの保護者",
        "顔認証サービスをよく使う",
        "一般市民として関心がある",
        OTHER_FREE_TEXT_OPTION,
      ],
    },
    {
      kind: "fixed",
      question: "今回の法案について、現時点でどの程度ご存知ですか。",
      follow_up_guide:
        "回答内容から専門知識レベルを判断し、以降の質問の深さや用語の使い方を調整する。この質問自体での深掘りは行わない。理解度が高くない場合のみ、以降の質問で制度名を出す前に短い要約を1文だけ挟む。回答を受け止めたらQ4に進む。",
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
      follow_up_guide: `評価の理由を1〜2点だけ短く聞く。賛否が割れる論点があれば、どの論点が評価を左右したかを1回確認する。回答を受け止めたらQ5（Q1で選んだテーマの深掘り）に進む。\n${FOLLOW_UP_DEPTH_LIMIT_RULE}`,
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
      follow_up_guide: `Q1で選んだテーマに即した具体論を引き出す中心的な質問。必要に応じて「どんな場面を想像したか」「どの立場での懸念か」などで具体化する。深掘りが一段落したらQ6に進む。\n${FOLLOW_UP_DEPTH_LIMIT_RULE}`,
    },
    {
      kind: "fixed",
      question:
        "この法案を実際に運用するうえでハードルがあると思いますか？また、影響を受ける側（個人・事業者・組織など）のさまざまなケースが十分に考慮されていると思いますか？",
      follow_up_guide:
        "「いいえ」の場合は、見落とされそうな具体例（例: 属性や立場の違い（個人・事業者・組織など）、規模や条件の違い（小規模／大規模、地域差、就労形態など）、既存の仕組みとの関係、対象から漏れそうなケースなど）を引き出す。「わからない」の場合は、無理せず次の質問に進む。具体的なキーワードを含む回答を得られた場合は深掘りをやめて次の質問に行く。なるべく一度の質問で回答者から具体的な回答を得るようにこころがけ、長々と質問を続けない。回答者とのやりとりは最大5往復までにとどめる。深掘りが一段落したらQ7に進む。",
      quick_replies: [
        "はい（十分考慮されている／ハードルは小さい）",
        "いいえ（考慮が不十分／ハードルが大きい）",
        "わからない",
      ],
    },
    {
      kind: "fixed",
      question:
        "最後に、この制度を設計する人に、何か一つ伝えるとしたらそれは何ですか？",
      follow_up_guide: `最後の質問。要望を端的に受け止める。可能なら「それが実現したら評価はどう変わるか」を1度だけ確認する。\n${FOLLOW_UP_DEPTH_LIMIT_RULE}`,
    },
  ];

/**
 * テンプレートと LLM 生成の quick_replies を合成して質問配列を組み立てる。
 *
 * - Q1/Q2: 固定の質問文・follow_up_guide + LLM 生成の quick_replies
 *   （LLM 応答が無ければサンプルで代替。末尾に「その他（自由記述）」を必ず付与）
 * - 固定質問はそのまま。
 */
export function buildQuestionsFromTemplate(params: {
  topics?: string[];
  stance?: string[];
}): InterviewQuestionInput[] {
  const { topics, stance } = params;

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

    // LLM が返した選択肢から、空白・「その他（自由記述）」を除いた実質的な選択肢を抽出。
    // 全て空 / 「その他」のみだった場合はサンプルにフォールバックする。
    const userChoices = ((entry.slot === "topics" ? topics : stance) ?? [])
      .filter((r) => typeof r === "string" && r.trim().length > 0)
      .map((r) => r.trim())
      .filter((r) => r !== OTHER_FREE_TEXT_OPTION);
    const finalChoices =
      userChoices.length > 0
        ? userChoices
        : entry.sample_quick_replies.filter(
            (r) => r !== OTHER_FREE_TEXT_OPTION
          );
    return {
      question: entry.question,
      follow_up_guide: entry.follow_up_guide,
      quick_replies: [...finalChoices, OTHER_FREE_TEXT_OPTION],
    };
  });
}
