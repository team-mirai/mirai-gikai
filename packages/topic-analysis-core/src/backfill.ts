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

export type BackfillChunkResult = {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  remaining: number;
};

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

type ReextractTally = { updated: number; skipped: number; failed: number };

/** 対象レポート群を CONCURRENCY 件ずつ並列で再抽出し、結果を集計する。 */
async function processReportsInWaves(
  targets: BackfillTargetReport[],
  deps: ReextractDeps
): Promise<ReextractTally> {
  const results = [];
  for (let i = 0; i < targets.length; i += OPINION_BACKFILL_CONCURRENCY) {
    const wave = targets.slice(i, i + OPINION_BACKFILL_CONCURRENCY);
    const waveResults = await Promise.all(
      wave.map((t) => reextractReportOpinions(t, deps))
    );
    results.push(...waveResults);
  }
  return {
    updated: results.filter((r) => r.status === "updated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
}

/**
 * 未再抽出レポートを1チャンク分（最大 CHUNK_SIZE 件）処理する。
 * チャンク内は CONCURRENCY 件ずつ並列実行する。
 * 成功・スキップはウォーターマークを進めるが、失敗（生成エラー等）は進めない。
 */
export async function runOpinionBackfillChunk(
  deps: { billId?: string } & ReextractDeps = {}
): Promise<BackfillChunkResult> {
  const { billId, generateReport, model } = deps;
  const targets = await findReportsToReextract(
    OPINION_BACKFILL_CHUNK_SIZE,
    billId
  );
  const tally = await processReportsInWaves(targets, { generateReport, model });
  const remaining = await countPendingReextraction(billId);

  return { processed: targets.length, ...tally, remaining };
}

/**
 * 未再抽出レポート（opinions_reextracted_at IS NULL）をウォーターマーク方式で
 * 全件完了まで処理する。チャンクを繰り返し、remaining が 0 になるか前進が止まったら終了する。
 * 失敗レポートはウォーターマークが進まないため、チャンク間で remaining が
 * 減らなくなった時点で「全件失敗ループ」と判断して停止する（無限ループ防止）。
 */
async function runPendingBackfill(
  deps: { billId?: string } & ReextractDeps
): Promise<void> {
  let prevRemaining = Number.POSITIVE_INFINITY;

  while (true) {
    const result = await runOpinionBackfillChunk(deps);
    console.log(
      `[topic-analysis] backfill chunk: processed=${result.processed} updated=${result.updated} skipped=${result.skipped} failed=${result.failed} remaining=${result.remaining}`
    );

    if (result.remaining === 0) {
      console.log("[topic-analysis] backfill completed (remaining=0)");
      return;
    }
    if (result.processed === 0) {
      console.log("[topic-analysis] backfill stopped: nothing to process");
      return;
    }
    if (result.remaining >= prevRemaining) {
      // 前チャンクから remaining が減っていない = 全件失敗で前進していない。
      console.warn(
        `[topic-analysis] backfill stopped: no forward progress (remaining=${result.remaining})`
      );
      return;
    }
    prevRemaining = result.remaining;
  }
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

  await runPendingBackfill({ billId, generateReport, model });
}
