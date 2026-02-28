/**
 * 議案詳細ページへのリンクを取得
 */
export function getBillDetailLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return `/preview/bills/${billId}?token=${previewToken}`;
  }
  return `/bills/${billId}`;
}

/**
 * インタビューLPページへのリンクを取得
 */
export function getInterviewLPLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return `/preview/bills/${billId}/interview?token=${previewToken}`;
  }
  return `/bills/${billId}/interview`;
}

/**
 * インタビュー情報開示ページへのリンクを取得
 */
export function getInterviewDisclosureLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return `/preview/bills/${billId}/interview/disclosure?token=${previewToken}`;
  }
  return `/bills/${billId}/interview/disclosure`;
}

/**
 * インタビューチャットページへのリンクを取得
 */
export function getInterviewChatLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return `/preview/bills/${billId}/interview/chat?token=${previewToken}`;
  }
  return `/bills/${billId}/interview/chat`;
}

/**
 * インタビュー完了レポートページへのリンクを取得
 */
export function getInterviewReportCompleteLink(reportId: string): string {
  return `/report/${reportId}/complete`;
}

/**
 * インタビュー会話ログページへのリンクを取得
 */
export function getInterviewChatLogLink(reportId: string): string {
  return `/report/${reportId}/chat-log`;
}
