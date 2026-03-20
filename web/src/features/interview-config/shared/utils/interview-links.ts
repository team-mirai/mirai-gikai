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
 */
export function getPublicReportLink(reportId: string): string {
  return routes.publicReport(reportId);
}

/**
 * インタビュー会話ログページへのリンクを取得
 */
export function getInterviewChatLogLink(reportId: string): string {
  return routes.reportChatLog(reportId);
}
