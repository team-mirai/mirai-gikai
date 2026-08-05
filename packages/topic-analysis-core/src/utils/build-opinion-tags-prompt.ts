import { OPINION_TAG_CRITERIA } from "@mirai-gikai/shared/interview-report/opinion-tags-schema";
import type { ReextractionMessage } from "../shared/types";

/**
 * 「直前の質問」として遡る assistant 発言の距離上限。
 *
 * 入力は prepareReextractionMessages 済みで、assistant のレポート提示ターンが
 * 除去されている。要約フェーズでのユーザー追記に source_message_id が付いていると、
 * 無制限に遡るとインタビュー本体の無関係な古い質問を「直前の質問」として渡してしまう。
 */
const MAX_QUESTION_LOOKBACK = 2;

/** タグ付け対象の意見（interview_opinion の既存行から作る）。 */
export type OpinionToTag = {
  opinion_index: number;
  title: string;
  content: string;
  contextual_quote: string | null;
  source_message_id: string | null;
};

export type OpinionTagsPromptInput = {
  billName: string;
  /** 回答者の立場タイプ（interview_report.role）。 */
  role: string | null;
  /** 回答者の立場の短縮タイトル（interview_report.role_title）。 */
  roleTitle: string | null;
  opinions: OpinionToTag[];
  /** prepareReextractionMessages で整形済みの会話ログ。 */
  messages: ReextractionMessage[];
};

/**
 * 指定ユーザー発言の直前にあるインタビュアー（assistant）の発言を返す純粋関数。
 * 発言を引き出した質問が分かると、その意見が何に答えたものかを判定しやすくなる。
 * 該当ユーザー発言が無い / 直前に assistant が無い場合は null。
 */
export function findPrecedingQuestion(
  messages: ReextractionMessage[],
  userMessageId: string | null
): string | null {
  if (!userMessageId) return null;

  const userIndex = messages.findIndex(
    (m) => m.role === "user" && m.id === userMessageId
  );
  if (userIndex < 0) return null;

  const lowerBound = Math.max(0, userIndex - MAX_QUESTION_LOOKBACK);
  for (let i = userIndex - 1; i >= lowerBound; i--) {
    const candidate = messages[i];
    if (candidate.role === "assistant") {
      const text = candidate.content.trim();
      return text || null;
    }
  }
  return null;
}

/** 指定ユーザー発言の本文を返す純粋関数。解決できなければ null。 */
export function findUserMessageContent(
  messages: ReextractionMessage[],
  userMessageId: string | null
): string | null {
  if (!userMessageId) return null;
  const found = messages.find(
    (m) => m.role === "user" && m.id === userMessageId
  );
  const text = found?.content.trim();
  return text || null;
}

const SYSTEM_INSTRUCTIONS = `あなたは政策分析の専門家です。市民インタビューから抽出済みの「意見」を読み、政務調査で集計できる形にタグ付けします。

意見の本文（title / content）を書き換える仕事ではありません。**既存の意見に対してタグだけを付けます。**

## 各フィールドの判定基準

**concern**（懸念）
${OPINION_TAG_CRITERIA.concern}

**proposal**（提案・要望）
${OPINION_TAG_CRITERIA.proposal}

**reasoning_types**（根拠の種類・複数可）
${OPINION_TAG_CRITERIA.reasoningTypes}

## 出力ルール

- 入力で提示した意見すべてに対して1件ずつ返す。\`opinion_index\` は提示された値をそのまま返す
- 迷ったら**保守的に少ない分類**にする（曖昧なら concern / proposal は null）
- 発言原文に無いことを推測で補わない`;

/** 意見1件分の入力ブロックを組み立てる。 */
function formatOpinionBlock(
  opinion: OpinionToTag,
  messages: ReextractionMessage[]
): string {
  const question = findPrecedingQuestion(messages, opinion.source_message_id);
  const sourceContent = findUserMessageContent(
    messages,
    opinion.source_message_id
  );

  const lines = [
    `### 意見 opinion_index=${opinion.opinion_index}`,
    `- タイトル: ${opinion.title}`,
    `- 説明: ${opinion.content}`,
  ];
  if (opinion.contextual_quote) {
    lines.push(`- 引用: ${opinion.contextual_quote}`);
  }
  if (question) {
    lines.push(`- 直前の質問（インタビュアー発言）: ${question}`);
  }
  if (sourceContent) {
    lines.push(`- 発言原文: ${sourceContent}`);
  }
  return lines.join("\n");
}

/**
 * 既存意見へのタグ付け用プロンプトを組み立てる純粋関数。
 * 会話ログ全体は渡さず、各意見の source_message_id から「発言原文」と
 * 「直前の質問」だけを引いて渡す。根拠の判定に必要な文脈を保ちつつ入力を絞る。
 */
export function buildOpinionTagsPrompt(input: OpinionTagsPromptInput): string {
  const { billName, role, roleTitle, opinions, messages } = input;

  const roleLines = [];
  if (role) roleLines.push(`- role: ${role}`);
  if (roleTitle) roleLines.push(`- role_title: ${roleTitle}`);
  const roleBlock = roleLines.length
    ? `\n## 回答者の立場\n${roleLines.join("\n")}\n`
    : "";

  const opinionBlocks = opinions
    .map((opinion) => formatOpinionBlock(opinion, messages))
    .join("\n\n");

  return `${SYSTEM_INSTRUCTIONS}

# 対象議案
${billName}
${roleBlock}
# タグ付けする意見（${opinions.length}件）

${opinionBlocks}

上記すべての意見について、指定のスキーマに従ってタグを出力してください。`;
}
