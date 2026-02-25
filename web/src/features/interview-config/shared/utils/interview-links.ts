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
 * インタビューチャットページへのリンクを取得
 */
export function getInterviewChatLink(
  billId: string,
  previewToken?: string,
  mode?: "voice"
): string {
  const params = new URLSearchParams();
  if (previewToken) params.set("token", previewToken);
  if (mode) params.set("mode", mode);
  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  if (previewToken) {
    return `/preview/bills/${billId}/interview/chat${suffix}`;
  }
  return `/bills/${billId}/interview/chat${suffix}`;
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
