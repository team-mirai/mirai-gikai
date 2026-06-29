// ユーザー向けトピック分析・公開インタビュー回答の公開データ契約と純粋ロジック。
// **ブラウザ安全**（DB クライアント等のサーバ専用依存を持たない）なので、
// Client Components からも安全に import できる。
//
// 契約として user_id・email 等の直接的な識別子は含めない。ただし
// PublicRespondentDetail の role_description・会話ログは回答者の自由記述であり、
// 固有名詞等が含まれ得る（「識別子フリー」であって「内容PIIフリー」ではない）。
//
// Supabase へアクセスする repository / loaders はサーバ専用のため
// `@mirai-gikai/topic-analysis-core/public-server` に分離している。
export type {
  PublicOpinion,
  PublicRespondent,
  PublicRespondentDetail,
  PublicTopic,
  PublicTopicAnalysis,
  PublishedVersionMeta,
  RawOpinionRow,
  RawRespondentDetailRow,
  RawRespondentRow,
  RawTopicRow,
  RawTranscriptMessageRow,
  TranscriptMessage,
  UserCategory,
} from "./public-types";
export { normalizeRoleTitle } from "./normalize-role-title";
export { normalizeStanceToSentiment } from "./normalize-stance";
export {
  buildPublicTopicAnalysis,
  mapRoleToCategory,
} from "./build-public-topic-analysis";
export { buildPublicBillRespondents } from "./build-public-bill-respondents";
export { buildPublicRespondentDetail } from "./build-public-respondent-detail";
