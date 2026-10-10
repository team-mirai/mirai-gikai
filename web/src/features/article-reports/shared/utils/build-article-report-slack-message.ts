import {
  ARTICLE_REPORT_CATEGORY_LABELS,
  type ArticleReportCategory,
} from "@mirai-gikai/shared/article-report/categories";
import {
  DIFFICULTY_LABELS,
  type DifficultyLevelEnum,
} from "@/features/bill-difficulty/shared/types";

export const SLACK_BODY_PREVIEW_LENGTH = 300;

export function buildAdminArticleReportsUrl(
  adminUrl: string,
  billId: string
): string {
  return `${adminUrl.replace(/\/+$/, "")}/bills/${billId}/article-reports`;
}

function truncate(text: string, maxLength: number): string {
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return `${chars.slice(0, maxLength).join("")}…`;
}

// Slack の mrkdwn で制御文字として解釈される記号だけをエスケープする
function escapeSlackText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildArticleReportSlackMessage(params: {
  billName: string;
  difficultyLevel: DifficultyLevelEnum;
  category: ArticleReportCategory | undefined;
  body: string;
  adminReportsUrl: string;
}): string {
  const categoryLabel = params.category
    ? ARTICLE_REPORT_CATEGORY_LABELS[params.category]
    : "未選択";

  return [
    "AI版記事に誤り報告が届きました",
    `議案: ${escapeSlackText(params.billName)}`,
    `難易度: ${DIFFICULTY_LABELS[params.difficultyLevel]}`,
    `種類: ${categoryLabel}`,
    `内容: ${escapeSlackText(truncate(params.body, SLACK_BODY_PREVIEW_LENGTH))}`,
    `一覧: ${params.adminReportsUrl}`,
  ].join("\n");
}
