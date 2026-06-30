import "server-only";

// 公開（PII セーフ・§8 固定）読み取りの**サーバ専用**エントリポイント。
// web の公開ページ / 公開 API が使う。Supabase（createAdminClient）に触れる
// repository / loaders をここに集約し、ブラウザ安全な純粋ロジック（./public）と分離する。
//
// 内部用途（admin MCP）の「全件＋任意フィルタ」経路は
// `@mirai-gikai/topic-analysis-core/internal-server` に分離している。
export * from "./public";
export {
  type PublishedAnalysisData,
  findPublicBillRespondentRows,
  findPublishedAnalysis,
} from "./public-read-repository";
export {
  getPublicBillRespondents,
  getPublicTopicAnalysis,
} from "./loaders";
