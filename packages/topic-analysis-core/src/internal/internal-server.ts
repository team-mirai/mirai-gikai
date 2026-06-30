import "server-only";

// 内部用途（admin MCP）の**サーバ専用**読み取りエントリポイント。
// デフォルトで公開・非公開・モデレーション状態を問わず取得し、ReadFilter で任意に絞り込む。
// web 公開ページの「公開（§8 固定）」経路（@mirai-gikai/topic-analysis-core/public-server）とは別物。
// 直接識別子（user_id・email・expert_registrations）は返却型に含めない。
export {
  type ReadFilter,
  getRespondentDetail,
  getTopicAnalysis,
  listRespondents,
} from "./loaders";
