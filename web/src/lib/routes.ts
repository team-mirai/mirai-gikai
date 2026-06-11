/**
 * web アプリの内部ルート定義
 *
 * app/ ディレクトリの page.tsx と 1:1 対応する。
 * Link href や router.push には必ずこのファイルの関数を使うこと。
 * 新しいページを追加したらここにもルートを追加し、テストを通すこと。
 */

function buildPreviewInterviewPath(
  basePath: string,
  token: string,
  configId?: string
): string {
  const params = new URLSearchParams({ token });
  if (configId) params.set("configId", configId);
  return `${basePath}?${params.toString()}`;
}

export const routes = {
  // ── 静的ルート ──────────────────────────────────────
  home: () => "/" as const,
  terms: () => "/terms" as const,
  privacy: () => "/privacy" as const,

  // ── 議案 ──────────────────────────────────────────
  billDetail: (billId: string) => `/bills/${billId}` as const,
  billOpinions: (billId: string) => `/bills/${billId}/opinions` as const,

  // ── インタビュー ──────────────────────────────────
  interviewLP: (billId: string) => `/bills/${billId}/interview` as const,
  interviewDisclosure: (billId: string) =>
    `/bills/${billId}/interview/disclosure` as const,
  interviewChat: (billId: string) => `/bills/${billId}/interview/chat` as const,

  // ── プレビュー（token 付き） ──────────────────────
  previewBillDetail: (billId: string, token: string) =>
    `/preview/bills/${billId}?token=${encodeURIComponent(token)}` as const,
  previewInterviewLP: (billId: string, token: string, configId?: string) =>
    buildPreviewInterviewPath(
      `/preview/bills/${billId}/interview`,
      token,
      configId
    ),
  previewInterviewDisclosure: (
    billId: string,
    token: string,
    configId?: string
  ) =>
    buildPreviewInterviewPath(
      `/preview/bills/${billId}/interview/disclosure`,
      token,
      configId
    ),
  previewInterviewChat: (billId: string, token: string, configId?: string) =>
    buildPreviewInterviewPath(
      `/preview/bills/${billId}/interview/chat`,
      token,
      configId
    ),

  // ── レポート ──────────────────────────────────────
  publicReport: (reportId: string) => `/report/${reportId}` as const,
  reportComplete: (reportId: string) => `/report/${reportId}/complete` as const,
  legacyReportChatLog: (reportId: string) =>
    `/report/${reportId}/chat-log` as const,

  // ── 国会セッション ────────────────────────────────
  kokkaiSessionBills: (slug: string) => `/kokkai/${slug}/bills` as const,
} as const;
