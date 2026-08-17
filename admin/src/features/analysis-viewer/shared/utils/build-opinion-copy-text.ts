import type { FlatOpinion } from "../types";
import { formatOpinionRole } from "./format-opinion-role";

/**
 * 選んだ意見を Markdown の箇条書きに変換する純粋関数。
 *
 * 質問案づくりでドキュメントに貼ることを前提にしている。1意見を1ブロックにし、
 * 立場・論点・発言・URL を子項目に並べる。
 *
 * 発言原文（contextual_quote）は改行を含みうる。素直に流すと Markdown の
 * 箇条書きが途中で切れるので、1行に畳んでから入れる。
 */
export type OpinionCopyContext = {
  billName: string;
  /** レポート詳細の絶対URL。辿れない意見では null を返す。 */
  reportUrl: (opinion: FlatOpinion) => string | null;
};

export function buildOpinionCopyText(
  opinions: readonly FlatOpinion[],
  context: OpinionCopyContext
): string {
  if (opinions.length === 0) return "";

  const blocks = opinions.map((opinion) => {
    const lines = [`- **${opinion.title}**`];

    const role = formatOpinionRole(opinion.role, opinion.roleTitle);
    if (role) lines.push(`  - 立場: ${role}`);

    lines.push(
      `  - 論点: ${opinion.bigTopicTitle} › ${opinion.mediumTopicTitle}`
    );

    const quote = collapse(opinion.contextualQuote ?? opinion.content);
    if (quote) lines.push(`  - 発言: ${quote}`);

    if (opinion.concern) lines.push(`  - 懸念: ${collapse(opinion.concern)}`);
    if (opinion.proposal) lines.push(`  - 提案: ${collapse(opinion.proposal)}`);

    const url = context.reportUrl(opinion);
    if (url) lines.push(`  - ${url}`);

    return lines.join("\n");
  });

  return [
    `## ${context.billName} 意見抜粋（${opinions.length}件）`,
    "",
    ...blocks,
  ].join("\n");
}

/** 改行と連続空白を1つの空白に畳む。箇条書きの途中で切れるのを防ぐ。 */
function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
