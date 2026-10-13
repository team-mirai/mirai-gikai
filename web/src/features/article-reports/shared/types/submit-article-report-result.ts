export type SubmitArticleReportResult =
  | { ok: true }
  | { ok: false; error: string };

export const ARTICLE_REPORT_FAILED_MESSAGE =
  "送信に失敗しました。しばらく待ってから再度お試しください";
