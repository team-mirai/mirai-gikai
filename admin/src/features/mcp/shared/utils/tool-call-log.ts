import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** ログ1行が長くなりすぎないよう、引数やエラー文を切り詰める文字数 */
const MAX_LOG_VALUE_LENGTH = 500;

export type ToolResultForLog = Pick<CallToolResult, "content" | "isError">;

type ToolResultContent = CallToolResult["content"][number];

export function truncateForLog(
  value: string,
  maxLength = MAX_LOG_VALUE_LENGTH
): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}…(${value.length} chars)`;
}

/** ツールの引数を JSON にして切り詰める。引数が無いツールは - */
export function summarizeToolArgs(args: unknown): string {
  if (args === undefined) return "-";
  return truncateForLog(JSON.stringify(args));
}

function summarizeContent(content: ToolResultContent): string {
  switch (content.type) {
    case "text":
      return `text(${content.text.length} chars)`;
    case "image":
      return `image(${content.mimeType}, ${content.data.length} base64 chars)`;
    default:
      return content.type;
  }
}

/**
 * ツールの返り値の概要を返す。本文は出さず、種類と大きさだけを出す。
 * エラーのときは理由が分かるよう、テキストを切り詰めて出す
 */
export function summarizeToolResult(result: ToolResultForLog): string {
  const contents = result.content.map(summarizeContent).join(", ");
  if (!result.isError) return `ok content=[${contents}]`;
  const message = result.content
    .flatMap((content) => (content.type === "text" ? [content.text] : []))
    .join(" ");
  return `error content=[${contents}] message=${truncateForLog(message)}`;
}
