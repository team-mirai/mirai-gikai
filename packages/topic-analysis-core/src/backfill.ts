import {
  countPendingReextraction,
  findAllReportsForBill,
  findReportsToReextract,
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

export type BackfillOptions = {
  /** 指定議案に限定して実行する。未指定なら全議案。 */
  billId?: string;
  /**
   * "pending"（既定）: 未再抽出のレポートのみ。
   * "all": 既に再抽出済みも含めて全件やり直す（billId 必須）。
   */
  scope?: BackfillScope;
  generateReport?: GenerateReportFn;
};

type ReextractTally = { updated: number; skipped: number; failed: number };

/** 対象レポート群を CONCURRENCY 件ずつ並列で再抽出し、結果を集計する。 */
async function processReportsInWaves(
  targets: BackfillTargetReport[],
  deps: { generateReport?: GenerateReportFn }
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
  deps: { billId?: string; generateReport?: GenerateReportFn } = {}
): Promise<BackfillChunkResult> {
  const { billId, generateReport } = deps;
  const targets = await findReportsToReextract(
    OPINION_BACKFILL_CHUNK_SIZE,
    billId
  );
  const tally = await processReportsInWaves(targets, { generateReport });
  const remaining = await countPendingReextraction(billId);

  return { processed: targets.length, ...tally, remaining };
}

/**
 * 未再抽出レポート（opinions_reextracted_at IS NULL）をウォーターマーク方式で
 * 全件完了まで処理する。チャンクを繰り返し、remaining が 0 になるか前進が止まったら終了する。
 * 失敗レポートはウォーターマークが進まないため、チャンク間で remaining が
 * 減らなくなった時点で「全件失敗ループ」と判断して停止する（無限ループ防止）。
 */
async function runPendingBackfill(deps: {
  billId?: string;
  generateReport?: GenerateReportFn;
}): Promise<void> {
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
 * 指定議案の全レポートを再抽出済み有無にかかわらず1回ずつ再抽出する（scope="all"）。
 * ウォーターマークではなく固定の対象リストで終端するため、既処理レポートも対象になる。
 */
async function runFullBackfillForBill(
  billId: string,
  deps: { generateReport?: GenerateReportFn }
): Promise<void> {
  const targets = await findAllReportsForBill(billId);
  console.log(
    `[topic-analysis] full backfill for bill=${billId}: targets=${targets.length}`
  );

  for (let i = 0; i < targets.length; i += OPINION_BACKFILL_CHUNK_SIZE) {
    const chunk = targets.slice(i, i + OPINION_BACKFILL_CHUNK_SIZE);
    const tally = await processReportsInWaves(chunk, deps);
    console.log(
      `[topic-analysis] full backfill chunk: processed=${chunk.length} updated=${tally.updated} skipped=${tally.skipped} failed=${tally.failed} done=${Math.min(i + chunk.length, targets.length)}/${targets.length}`
    );
  }
  console.log("[topic-analysis] full backfill completed");
}

/**
 * 意見再抽出バックフィルを実行する（Cloud Run Job のメイン処理）。
 * - scope="pending"（既定）: 未再抽出レポートをウォーターマーク方式で全件処理。
 * - scope="all": 指定議案の全レポートを既処理含めてやり直す（billId 必須）。
 */
export async function runBackfill(options: BackfillOptions = {}): Promise<void> {
  const { billId, scope = "pending", generateReport } = options;
  console.log(
    `[topic-analysis] start opinion backfill (scope=${scope} bill=${billId ?? "all"})`
  );

  if (scope === "all") {
    if (!billId) {
      throw new Error('backfill scope="all" requires a billId');
    }
    await runFullBackfillForBill(billId, { generateReport });
    return;
  }

  await runPendingBackfill({ billId, generateReport });
}
