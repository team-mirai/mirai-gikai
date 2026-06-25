// 公開（PII セーフ）読み取りの**サーバ専用**エントリポイント。
// Supabase（createAdminClient / SUPABASE_SECRET_KEY）に触れる repository / loaders を
// ここに集約し、ブラウザ安全な純粋ロジック（./public）と分離する。
// サーバ（web の loaders / Server Components / admin MCP）からのみ import すること。
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
