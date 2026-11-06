import {
  countPendingReextraction,
  findReportsToReextract,
  resetReextractionForBill,
} from "./repositories/backfill-repository";
import {
  type GenerateReportFn,
  reextractReportOpinions,
} from "./services/reextract-report-opinions";
import type { BackfillScope } from "./shared/backfill-params";
import type { BackfillTargetReport } from "./shared/types";
import {
  OPINION_BACKFILL_CHUNK_SIZE,
  OPINION_BACKFILL_CONCURRENCY,
} from "./shared/constants";
import {
  type BackfillChunkResult,
  runWatermarkBackfill,
  runWatermarkBackfillChunk,
  type WatermarkBackfillSteps,
} from "./utils/run-watermark-backfill";

export type { BackfillChunkResult };

/** 再抽出1件あたりの依存（生成関数の差し替え・使用モデル）。 */
type ReextractDeps = { generateReport?: GenerateReportFn; model?: string };

export type BackfillOptions = ReextractDeps & {
  /** 指定議案に限定して実行する。未指定なら全議案。 */
  billId?: string;
  /**
   * "pending"（既定）: 未再抽出のレポートのみ。
   * "all": 既に再抽出済みも含めて全件やり直す（billId 必須）。
   */
  scope?: BackfillScope;
};

/** 共通ドライバに渡すステップ定義を組み立てる。 */
function buildSteps(
  deps: { billId?: string } & ReextractDeps
): WatermarkBackfillSteps<BackfillTargetReport> {
  const { billId, generateReport, model } = deps;
  return {
    label: "backfill",
    chunkSize: OPINION_BACKFILL_CHUNK_SIZE,
    concurrency: OPINION_BACKFILL_CONCURRENCY,
    findTargets: (limit) => findReportsToReextract(limit, billId),
    processTarget: (target) =>
      reextractReportOpinions(target, { generateReport, model }),
    countRemaining: () => countPendingReextraction(billId),
  };
}

/**
 * 未再抽出レポートを1チャンク分（最大 CHUNK_SIZE 件）処理する。
 * チャンク内は CONCURRENCY 件ずつ並列実行する。
 * 成功・スキップはウォーターマークを進めるが、失敗（生成エラー等）は進めない。
 */
export function runOpinionBackfillChunk(
  deps: { billId?: string } & ReextractDeps = {}
): Promise<BackfillChunkResult> {
  return runWatermarkBackfillChunk(buildSteps(deps));
}

/**
 * 意見再抽出バックフィルを実行する（Cloud Run Job のメイン処理）。
 * - scope="pending"（既定）: 未再抽出レポートをウォーターマーク方式で全件処理。
 * - scope="all": 指定議案のウォーターマークを一旦リセットしてから全件処理し直す（billId 必須）。
 *   リセットにより全件が未再抽出扱いになるため、進捗（pending）が正しく分母になる。
 * - model: 再抽出に使う AI モデル（未指定なら OPINION_BACKFILL_MODEL）。
 */
export async function runBackfill(options: BackfillOptions = {}): Promise<void> {
  const { billId, scope = "pending", generateReport, model } = options;
  console.log(
    `[topic-analysis] start opinion backfill (scope=${scope} bill=${billId ?? "all"} model=${model ?? "default"})`
  );

  if (scope === "all") {
    if (!billId) {
      throw new Error('backfill scope="all" requires a billId');
    }
    const reset = await resetReextractionForBill(billId);
    console.log(
      `[topic-analysis] reset ${reset} reextraction watermark(s) for bill=${billId}`
    );
  }

  await runWatermarkBackfill(buildSteps({ billId, generateReport, model }));
}
