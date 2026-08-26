/**
 * 管理画面から差し替えできるプロンプトの節。
 *
 * インタビューの聞き方は法案や相手によって変えたくなるが、プロンプト全文を
 * 開けると、クイックリプライやトピックタイトルの出力指示のように消えると
 * 機能が止まる部分まで消せてしまう。差し替えは「聞き方」に関わる節だけに絞り、
 * 出力の約束事・法案情報の差し込み・ステージ遷移はコード側に固定する。
 *
 * 既定値はモードごとに違うため、各モードのファイルが持つ。ここが持つのは
 * 「どの節を開けるか」と「上書きの重ね方」だけ。
 */

export const PROMPT_SECTION_KEYS = [
  "responsibilities",
  "cautions",
  "expertiseDetection",
  "deepDiveTechniques",
  "stopCriteria",
  "questionUsageRules",
] as const;

export type PromptSectionKey = (typeof PROMPT_SECTION_KEYS)[number];

/** モードごとの既定の節。 */
export type PromptSections = Record<PromptSectionKey, string>;

/** インタビュー設定ごとの上書き。未設定の節は既定値を使う。 */
export type PromptSectionOverrides = Partial<Record<PromptSectionKey, string>>;

/** 管理画面に出す節の見出しと説明。 */
export const PROMPT_SECTION_LABELS: Record<
  PromptSectionKey,
  { label: string; description: string }
> = {
  responsibilities: {
    label: "インタビュアーの役割",
    description: "会話をどう進める人なのかを定義します。",
  },
  cautions: {
    label: "話し方の注意事項",
    description:
      "口調や聞き方の作法です。1つのメッセージで複数を聞かない、といった指示を書きます。",
  },
  expertiseDetection: {
    label: "専門知識レベルの検出",
    description: "相手の詳しさに応じて言葉遣いをどう変えるかを指示します。",
  },
  deepDiveTechniques: {
    label: "深掘りテクニック",
    description: "回答をどう掘り下げるかの手口を並べます。",
  },
  stopCriteria: {
    label: "深掘りの打ち切り基準",
    description:
      "どこまで掘ったらやめるかを決めます。聞き方がしつこいと感じるときはここを調整します。",
  },
  questionUsageRules: {
    label: "事前定義質問の活用ルール",
    description:
      "質問をどの順で使うか、どうなったらインタビューを終えるかを決めます。",
  },
};

/**
 * 1節あたりの上限。
 *
 * 保存時にも同じ値で検証するが、DB を直接触られた場合や過去の値が残っている
 * 場合に備えて読み出し側でも見る。既定値の合計が約2,300文字なので、
 * 上限まで使われるとシステムプロンプトが1桁増える。
 */
export const PROMPT_SECTION_MAX_LENGTH = 4000;

export function isPromptSectionKey(value: string): value is PromptSectionKey {
  return (PROMPT_SECTION_KEYS as readonly string[]).includes(value);
}

/**
 * 既定の節に上書きを重ねる。
 *
 * 上書きは DB の JSON から来るため、形が崩れていることを前提に読む。
 * 空白だけの値は「消したい」ではなく「入力していない」と解釈して既定値を残す。
 * 節を丸ごと消せてしまうと、プロンプトの体裁が崩れて挙動が読めなくなるため。
 */
export function resolvePromptSections(
  defaults: PromptSections,
  overrides: unknown
): PromptSections {
  const parsed = parsePromptSectionOverrides(overrides);
  return { ...defaults, ...parsed };
}

/** 未知のキーや文字列でない値を落として、扱える形にそろえる。 */
export function parsePromptSectionOverrides(
  overrides: unknown
): PromptSectionOverrides {
  if (typeof overrides !== "object" || overrides === null) return {};

  const result: PromptSectionOverrides = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (!isPromptSectionKey(key)) continue;
    if (typeof value !== "string") continue;
    if (value.trim() === "") continue;
    // 長すぎる値は捨てて既定値に倒す。毎ターンのプロンプトに載るため。
    if (value.length > PROMPT_SECTION_MAX_LENGTH) continue;
    result[key] = value;
  }
  return result;
}
