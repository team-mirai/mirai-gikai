import { AI_MODELS, DEFAULT_OPINION_BACKFILL_MODEL } from "@mirai-gikai/shared/ai/models";

// ── 分析（analyze）──
/** Phase1 一次抽出のバッチサイズ（§A.3: 30〜50件/バッチ） */
export const EXTRACT_BATCH_SIZE = 40;
/** Phase3 割当のバッチサイズ（§A.2: 20件/バッチ） */
export const ASSIGN_BATCH_SIZE = 20;
/** バッチ並列実行数（§A.3: 5〜10並列） */
export const MAX_CONCURRENCY = 10;
/** 各 Phase で使用するモデル（§4.4: Haiku が安定） */
export const TOPIC_MODEL = AI_MODELS.claude_haiku_4_5;
/** プロンプト版（再現性のため version に記録）。プロンプト/出力スキーマ変更時に上げる。 */
export const PROMPT_VERSION = "v3";
/** 実行ステップ（current_step） */
export const ANALYSIS_STEPS = {
  EXTRACT: "extract",
  MERGE: "merge",
  ASSIGN: "assign",
  DONE: "done",
} as const;

/**
 * 二重起動ガードで「実行中」とみなす version の鮮度しきい値。
 * Cloud Run の Job 実行は「受理されたが worker のコードに到達せず失敗」しうる
 * （不正イメージ・secret 欠落・quota/IAM 起動失敗・task-timeout 等）。
 * その場合 version が pending/running のまま残り、findActiveVersionByBill が
 * 永続的に「実行中」と判定して再実行をブロックしてしまう。
 * 以下の経過時間を超えた pending/running は失効（dead）とみなして再実行を許可する。
 */
/** pending のまま起動されなかったとみなすまでの時間（worker は数秒で running にする） */
export const STALE_PENDING_MS = 5 * 60_000;
/** running のまま完了しないとみなすまでの時間（task-timeout=3600s を超える猶予） */
export const STALE_RUNNING_MS = 70 * 60_000;

// ── バックフィル（backfill）──
/** 1チャンクで再抽出するレポート数 */
export const OPINION_BACKFILL_CHUNK_SIZE = 30;
/** チャンク内のLLM並列実行数 */
export const OPINION_BACKFILL_CONCURRENCY = 30;
/** 再抽出に使うモデル */
export const OPINION_BACKFILL_MODEL = DEFAULT_OPINION_BACKFILL_MODEL;

// ── タグ付けバックフィル（tag-backfill）──
// 既存意見の本文を触らず、タグ（concern/proposal/reasoning_types）だけを追加する経路。
/** 1チャンクでタグ付けするレポート数 */
export const OPINION_TAG_BACKFILL_CHUNK_SIZE = 30;
/** チャンク内のLLM並列実行数 */
export const OPINION_TAG_BACKFILL_CONCURRENCY = 30;
/**
 * タグ付けに使うモデル。
 * 入力は「抽出済みの意見＋その発言原文」に絞られ、出力は短い分類タグのみなので、
 * レポート生成用のモデルより軽いモデルで足りる。
 */
export const OPINION_TAG_MODEL = TOPIC_MODEL;
/**
 * タグ付け1回あたりのLLM呼び出しの上限時間。
 * 並列 CONCURRENCY 本のうち1本が返らないとウェーブ全体が止まるため明示する。
 */
export const OPINION_TAG_TIMEOUT_MS = 60_000;
