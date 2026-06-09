import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@mirai-gikai/shared/ai/models";

/** 1リクエストで再抽出するレポート数（Vercel 5分制限に収まる範囲） */
export const OPINION_BACKFILL_CHUNK_SIZE = 30;

/** チャンク内のLLM並列実行数（AI Gatewayのレート制限に合わせる） */
export const OPINION_BACKFILL_CONCURRENCY = 30;

/** 再抽出に使うモデル（本番のレポート生成と同じ） */
export const OPINION_BACKFILL_MODEL = DEFAULT_INTERVIEW_CHAT_MODEL;
