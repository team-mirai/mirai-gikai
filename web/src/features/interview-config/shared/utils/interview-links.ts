import { routes } from "@/lib/routes";

/**
 * 議案詳細ページへのリンクを取得
 */
export function getBillDetailLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewBillDetail(billId, previewToken);
  }
  return routes.billDetail(billId);
}

/**
 * インタビューLPページへのリンクを取得
 */
export function getInterviewLPLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewInterviewLP(billId, previewToken);
  }
  return routes.interviewLP(billId);
}

/**
 * インタビュー情報開示ページへのリンクを取得
 */
export function getInterviewDisclosureLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewInterviewDisclosure(billId, previewToken);
  }
  return routes.interviewDisclosure(billId);
}

/**
 * インタビューチャットページへのリンクを取得
 */
export function getInterviewChatLink(
  billId: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewInterviewChat(billId, previewToken);
  }
  return routes.interviewChat(billId);
}

/**
 * インタビュー完了レポートページへのリンクを取得
 */
export function getInterviewReportCompleteLink(reportId: string): string {
  return routes.reportComplete(reportId);
}

/**
 * 公開レポートページへのリンクを取得
 * @param from - 遷移元のコンテキスト。"opinions" の場合、戻るボタンがレポート一覧を指す
 */
export function getPublicReportLink(
  reportId: string,
  from?: "opinions"
): string {
  const base = routes.publicReport(reportId);
  if (from) {
    return `${base}?from=${from}`;
  }
  return base;
}

function getReportLinkForChatLogContext(
  reportId: string,
  from?: "complete" | "opinions"
): string {
  if (from === "complete") {
    return routes.reportComplete(reportId);
  }
  if (from === "opinions") {
    return getPublicReportLink(reportId, "opinions");
  }
  return routes.publicReport(reportId);
}

/**
 * インタビュー会話ログの表示先へのリンクを取得
 * @param from - 遷移元のコンテキスト。"complete" の場合は完了ページ内、"opinions" の場合は公開レポート一覧からの戻り文脈を維持する
 */
export function getInterviewChatLogLink(
  reportId: string,
  from?: "complete" | "opinions"
): string {
  return `${getReportLinkForChatLogContext(reportId, from)}#chat-log`;
}

/**
 * インタビュー会話ログ内の個別メッセージへのリンクを取得
 * @param from - 遷移元のコンテキスト。"complete" の場合は完了ページ内、"opinions" の場合は公開レポート一覧からの戻り文脈を維持する
 */
export function getInterviewMessageLink(
  reportId: string,
  messageId: string,
  from?: "complete" | "opinions"
): string {
  return `${getReportLinkForChatLogContext(reportId, from)}#message-${messageId}`;
}
