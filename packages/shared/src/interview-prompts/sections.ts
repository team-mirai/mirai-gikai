import { type InterviewMode, INTERVIEW_MODES } from "./types";

/**
 * プロンプトを構成する節。
 *
 * 節に切り出しているのは、管理画面から一部を差し替えられるようにするため。
 * ただし全部を開けているわけではない。クイックリプライやトピックタイトルの
 * 出力指示のように、消えると機能が止まる部分はそもそも節にしていない。
 *
 * 既定値はモードごとに違うため、各モードのファイルが持つ。
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

/**
 * 管理画面から差し替えられる節。
 *
 * 元の要望は「更問がしつこい」への対処なので、そこに効く2節に絞っている。
 * 開けるほど設定ごとにプロンプトが分岐し、モードを増やして評価を分ける方針から
 * 遠ざかる。足りなければここに足せばよく、zod スキーマとの同期はテストが見ている。
 */
export const EDITABLE_PROMPT_SECTION_KEYS = [
  "cautions",
  "stopCriteria",
] as const satisfies readonly PromptSectionKey[];

export type EditablePromptSectionKey =
  (typeof EDITABLE_PROMPT_SECTION_KEYS)[number];

/** 1モードぶんの上書き。未設定の節は既定値を使う。 */
export type PromptSectionOverrides = Partial<
  Record<EditablePromptSectionKey, string>
>;

/**
 * モードごとの上書き。
 *
 * 1つにまとめると、モードを切り替えたときに前のモード向けの文面が残り、
 * 「都度深掘りする」と「深追いしない」が同じプロンプトに同居してしまう。
 */
export type PromptOverridesByMode = Partial<
  Record<InterviewMode, PromptSectionOverrides>
>;

/** 管理画面に出す節の見出しと説明。 */
export const PROMPT_SECTION_LABELS: Record<
  EditablePromptSectionKey,
  { label: string; description: string }
> = {
  cautions: {
    label: "話し方の注意事項",
    description:
      "口調や聞き方の作法です。1つのメッセージで複数を聞かない、といった指示を書きます。",
  },
  stopCriteria: {
    label: "深掘りの打ち切り基準",
    description:
      "どこまで掘ったらやめるかを決めます。聞き方がしつこいと感じるときはここを調整します。",
  },
};

/**
 * 1節あたりの上限。
 *
 * 既定値は1節あたり最大で約800文字。上書きは毎ターンのシステムプロンプトに
 * 載るので、書き足す余地を見つつ、際限なく膨らまない値にしている。
 */
export const PROMPT_SECTION_MAX_LENGTH = 2000;

export function isEditablePromptSectionKey(
  value: string
): value is EditablePromptSectionKey {
  return (EDITABLE_PROMPT_SECTION_KEYS as readonly string[]).includes(value);
}

/**
 * 既定の節に、そのモードの上書きを重ねる。
 *
 * 上書きは DB の JSON から来るため、形が崩れていることを前提に読む。
 */
export function resolvePromptSections(
  defaults: PromptSections,
  overrides: unknown,
  mode: InterviewMode
): PromptSections {
  return { ...defaults, ...parsePromptSectionOverrides(overrides, mode) };
}

/** 指定モードぶんの上書きを、扱える形にそろえて取り出す。 */
export function parsePromptSectionOverrides(
  overrides: unknown,
  mode: InterviewMode
): PromptSectionOverrides {
  return parsePromptOverridesByMode(overrides)[mode] ?? {};
}

/**
 * 全モードぶんの上書きを読む。
 *
 * 空白だけの値は「消したい」ではなく「入力していない」と解釈して既定値を残す。
 * 節を丸ごと空にできると、プロンプトの体裁が崩れて挙動が読めなくなるため。
 */
export function parsePromptOverridesByMode(
  overrides: unknown
): PromptOverridesByMode {
  if (!isPlainObject(overrides)) return {};

  const result: PromptOverridesByMode = {};
  for (const [mode, sections] of Object.entries(overrides)) {
    if (!isInterviewMode(mode)) continue;
    if (!isPlainObject(sections)) continue;

    const parsed: PromptSectionOverrides = {};
    for (const [key, value] of Object.entries(sections)) {
      if (!isEditablePromptSectionKey(key)) continue;
      if (typeof value !== "string") continue;
      if (value.trim() === "") continue;
      // 長すぎる値は捨てて既定値に倒す。毎ターンのプロンプトに載るため。
      if (value.length > PROMPT_SECTION_MAX_LENGTH) continue;
      parsed[key] = value;
    }

    if (Object.keys(parsed).length > 0) result[mode] = parsed;
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInterviewMode(value: string): value is InterviewMode {
  return (INTERVIEW_MODES as readonly string[]).includes(value);
}
