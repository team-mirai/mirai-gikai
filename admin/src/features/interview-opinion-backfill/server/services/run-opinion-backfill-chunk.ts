import "server-only";

import {
  OPINION_BACKFILL_CHUNK_SIZE,
  OPINION_BACKFILL_CONCURRENCY,
} from "../../shared/constants";
import {
  countPendingReextraction,
  findReportsToReextract,
} from "../repositories/interview-opinion-backfill-repository";
import {
  type GenerateReportFn,
  reextractReportOpinions,
} from "./reextract-report-opinions";

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
 * updated / skipped はウォーターマークを進める（前進）が、failed は進めず未処理として
 * 残りうるため、remaining は必ずしも減少しない（呼び出し側で前進ゼロ時に停止する）。
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
