/**
 * ウォーターマーク方式バックフィルの共通ドライバ。
 *
 * 意見の再抽出（backfill.ts）とタグ付け（tag-backfill.ts）は、
 * 「対象を limit 件引く → 並列で処理する → 残件を数える → 残件が減る限り繰り返す」
 * という同じ骨格を持つ。違うのは対象の引き方・処理内容・残件の数え方の3点だけなので、
 * ここに寄せて経路ごとの差分をその3つの関数に閉じ込める。
 */

export type BackfillChunkResult = {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  remaining: number;
};

/** 1件の処理結果。ウォーターマークが進んだか（updated/skipped）で集計する。 */
export type BackfillItemStatus = "updated" | "skipped" | "failed";

export type WatermarkBackfillSteps<TTarget> = {
  /** ログ接頭辞（例: "backfill" / "tag backfill"）。 */
  label: string;
  /** 1チャンクで処理する対象数。 */
  chunkSize: number;
  /** チャンク内の並列実行数。 */
  concurrency: number;
  /** 未処理の対象を最大 limit 件引く。 */
  findTargets: (limit: number) => Promise<TTarget[]>;
  /** 対象1件を処理する。 */
  processTarget: (target: TTarget) => Promise<{ status: BackfillItemStatus }>;
  /** 残っている未処理件数を返す。 */
  countRemaining: () => Promise<number>;
};

/** 対象群を concurrency 件ずつ並列処理し、結果を集計する。 */
async function processInWaves<TTarget>(
  targets: TTarget[],
  steps: WatermarkBackfillSteps<TTarget>
): Promise<Omit<BackfillChunkResult, "processed" | "remaining">> {
  const results: { status: BackfillItemStatus }[] = [];
  for (let i = 0; i < targets.length; i += steps.concurrency) {
    const wave = targets.slice(i, i + steps.concurrency);
    results.push(...(await Promise.all(wave.map(steps.processTarget))));
  }

  const tally = { updated: 0, skipped: 0, failed: 0 };
  for (const { status } of results) {
    tally[status] += 1;
  }
  return tally;
}

/** 1チャンク分（最大 chunkSize 件）処理して結果を返す。 */
export async function runWatermarkBackfillChunk<TTarget>(
  steps: WatermarkBackfillSteps<TTarget>
): Promise<BackfillChunkResult> {
  const targets = await steps.findTargets(steps.chunkSize);
  const tally = await processInWaves(targets, steps);
  const remaining = await steps.countRemaining();

  return { processed: targets.length, ...tally, remaining };
}

/**
 * 残件が 0 になるまでチャンクを繰り返す。
 *
 * 失敗した対象はウォーターマークが進まないため、残件が前チャンクから減らなくなった
 * 時点で「全件失敗ループ」と判断して停止する（無限ループ防止）。
 */
export async function runWatermarkBackfill<TTarget>(
  steps: WatermarkBackfillSteps<TTarget>
): Promise<void> {
  let prevRemaining = Number.POSITIVE_INFINITY;

  while (true) {
    const result = await runWatermarkBackfillChunk(steps);
    console.log(
      `[topic-analysis] ${steps.label} chunk: processed=${result.processed} updated=${result.updated} skipped=${result.skipped} failed=${result.failed} remaining=${result.remaining}`
    );

    if (result.remaining === 0) {
      console.log(`[topic-analysis] ${steps.label} completed (remaining=0)`);
      return;
    }
    if (result.processed === 0) {
      console.log(
        `[topic-analysis] ${steps.label} stopped: nothing to process`
      );
      return;
    }
    if (result.remaining >= prevRemaining) {
      console.warn(
        `[topic-analysis] ${steps.label} stopped: no forward progress (remaining=${result.remaining})`
      );
      return;
    }
    prevRemaining = result.remaining;
  }
}
