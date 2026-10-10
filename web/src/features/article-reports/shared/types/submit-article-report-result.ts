export type SubmitArticleReportResult =
  | { ok: true }
  | { ok: false; error: string };
