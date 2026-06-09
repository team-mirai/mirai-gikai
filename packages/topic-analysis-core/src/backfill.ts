import {
  countPendingReextraction,
  findReportsToReextract,
} from "./repositories/backfill-repository";
import {
  type GenerateReportFn,
  reextractReportOpinions,
} from "./services/reextract-report-opinions";
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

/**
 * 未再抽出レポートを1チャンク分（最大 CHUNK_SIZE 件）処理する。
 * チャンク内は CONCURRENCY 件ずつ並列実行する。
 * 成功・スキップはウォーターマークを進めるが、失敗（生成エラー等）は進めない。
 */
export async function runOpinionBackfillChunk(
  deps: { generateReport?: GenerateReportFn } = {}
): Promise<BackfillChunkResult> {
  const targets = await findReportsToReextract(OPINION_BACKFILL_CHUNK_SIZE);

  const results = [];
  for (let i = 0; i < targets.length; i += OPINION_BACKFILL_CONCURRENCY) {
    const wave = targets.slice(i, i + OPINION_BACKFILL_CONCURRENCY);
    const waveResults = await Promise.all(
      wave.map((t) => reextractReportOpinions(t, deps))
    );
    results.push(...waveResults);
  }

  const updated = results.filter((r) => r.status === "updated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const remaining = await countPendingReextraction();

  return { processed: results.length, updated, skipped, failed, remaining };
}

/**
 * 意見再抽出バックフィルを全件完了まで実行する（Cloud Run Job のメイン処理）。
 * チャンクを繰り返し、remaining が 0 になるか前進が止まったら終了する。
 * 失敗レポートはウォーターマークが進まないため、チャンク間で remaining が
 * 減らなくなった時点で「全件失敗ループ」と判断して停止する（無限ループ防止）。
 */
export async function runBackfill(
  deps: { generateReport?: GenerateReportFn } = {}
): Promise<void> {
  console.log("[topic-analysis] start opinion backfill");
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
