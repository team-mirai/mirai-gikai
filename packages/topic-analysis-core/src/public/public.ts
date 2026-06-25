// ユーザー向けトピック分析・公開インタビュー回答の「公開（PII セーフ）」データ契約と
// 純粋ロジック。**ブラウザ安全**（DB クライアント等のサーバ専用依存を持たない）なので、
// Client Components からも安全に import できる。
//
// Supabase へアクセスする repository / loaders はサーバ専用のため
// `@mirai-gikai/topic-analysis-core/public-server` に分離している。
export type {
  PublicOpinion,
  PublicRespondent,
  PublicTopic,
  PublicTopicAnalysis,
  PublishedVersionMeta,
  RawOpinionRow,
  RawRespondentRow,
  RawTopicRow,
  UserCategory,
} from "./public-types";
export { normalizeRoleTitle } from "./normalize-role-title";
export {
  buildPublicTopicAnalysis,
  mapRoleToCategory,
} from "./build-public-topic-analysis";
export { buildPublicBillRespondents } from "./build-public-bill-respondents";
