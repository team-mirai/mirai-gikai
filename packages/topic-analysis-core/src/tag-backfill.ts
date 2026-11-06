import {
  countPendingTagExtraction,
  findReportsToTag,
  resetTagExtractionForBill,
} from "./repositories/opinion-tags-repository";
import {
  extractOpinionTagsForReport,
  type GenerateTagsFn,
} from "./services/extract-opinion-tags";
import type { BackfillScope } from "./shared/backfill-params";
import {
  OPINION_TAG_BACKFILL_CHUNK_SIZE,
  OPINION_TAG_BACKFILL_CONCURRENCY,
} from "./shared/constants";
import {
  type BackfillChunkResult,
  runWatermarkBackfill,
  runWatermarkBackfillChunk,
  type WatermarkBackfillSteps,
} from "./utils/run-watermark-backfill";

type TagDeps = { generateTags?: GenerateTagsFn; model?: string };

export type TagBackfillOptions = TagDeps & {
  /** 指定議案に限定して実行する。未指定なら全議案。 */
  billId?: string;
  /**
   * "pending"（既定）: タグ未抽出の意見のみ。
   * "all": 既にタグ付け済みも含めて全件やり直す（billId 必須）。
   */
  scope?: BackfillScope;
};

/** 共通ドライバに渡すステップ定義を組み立てる。 */
function buildSteps(
  deps: { billId?: string } & TagDeps
): WatermarkBackfillSteps<Awaited<ReturnType<typeof findReportsToTag>>[number]> {
  const { billId, generateTags, model } = deps;
  return {
    label: "tag backfill",
    chunkSize: OPINION_TAG_BACKFILL_CHUNK_SIZE,
    concurrency: OPINION_TAG_BACKFILL_CONCURRENCY,
    findTargets: (limit) => findReportsToTag(limit, billId),
    processTarget: (target) =>
      extractOpinionTagsForReport(target, { generateTags, model }),
    // 残件は意見単位で数える（対象抽出はレポート単位だが進捗の分母は意見）。
    countRemaining: () => countPendingTagExtraction(billId),
  };
}

/** タグ未抽出の意見を1チャンク分処理する。 */
export function runOpinionTagBackfillChunk(
  deps: { billId?: string } & TagDeps = {}
): Promise<BackfillChunkResult> {
  return runWatermarkBackfillChunk(buildSteps(deps));
}

/**
 * 意見タグ付けバックフィルを実行する（Cloud Run Job のメイン処理）。
 * - scope="pending"（既定）: タグ未抽出の意見をウォーターマーク方式で全件処理。
 * - scope="all": 指定議案のウォーターマークをリセットしてから全件やり直す（billId 必須）。
 */
export async function runTagBackfill(
  options: TagBackfillOptions = {}
): Promise<void> {
  const { billId, scope = "pending", generateTags, model } = options;
  console.log(
    `[topic-analysis] start opinion tag backfill (scope=${scope} bill=${billId ?? "all"} model=${model ?? "default"})`
  );

  if (scope === "all") {
    // billId 必須は resolveBackfillParams でも検証しているが、
    // 直接呼び出しでも全議案リセットが起きないよう不変条件として残す。
    if (!billId) {
      throw new Error('tag backfill scope="all" requires a billId');
    }
    const reset = await resetTagExtractionForBill(billId);
    console.log(
      `[topic-analysis] reset ${reset} tag watermark(s) for bill=${billId}`
    );
  }

  await runWatermarkBackfill(buildSteps({ billId, generateTags, model }));
}
