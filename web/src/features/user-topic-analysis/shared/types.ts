// ユーザー向けトピック分析の公開データ契約（設計 §13 付録 A.4）は
// @mirai-gikai/topic-analysis-core/public に集約し、web 表示と admin MCP 連携で
// 同一の PII セーフな型を共有する（CLAUDE.md: web/admin 共有ロジックは packages へ）。
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
} from "@mirai-gikai/topic-analysis-core/public";
