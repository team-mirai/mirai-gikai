import {
  createVersion,
  fetchBillContext,
  fetchTargetOpinions,
  finalizeVersion,
  getTopicsWithOpinions,
  listAllBills,
  listVersionsByBill,
  loadProgress,
  markOpinionsExtracted,
  publishVersion,
  saveProgress,
  saveTopicsAndAssignments,
  updateVersionStatus,
  updateVersionStep,
} from "./repositories/analysis-repository";
import { assignOpinions } from "./services/assign-opinions";
import { extractTopics } from "./services/extract-topics";
import { judgeNewTopics } from "./services/judge-new-topics";
import { mergeTopics } from "./services/merge-topics";
import { ANALYSIS_STEPS, PROMPT_VERSION, TOPIC_MODEL } from "./shared/constants";
import type { FinalTopicWithId, TopicDraft } from "./shared/types";
import { buildSortedTopicsAndPairs } from "./utils/build-sorted-topics";
import {
  buildIncrementalPlan,
  selectUnextractedOpinions,
  toExistingTopics,
} from "./utils/incremental";

/** トピック分析の実行方式。full=全意見を再分析 / incremental=新規意見のみ差分追加。 */
export type AnalysisStrategy = "full" | "incremental";

// ── フル分析（従来どおり全意見を抽出・統合・割当） ──

/** Phase1: 対象意見・議案を取得しトピック候補を抽出 → progress 保存。 */
async function executeExtract(
  versionId: string,
  billId: string
): Promise<void> {
  await updateVersionStatus(versionId, "running");
  await updateVersionStep(versionId, ANALYSIS_STEPS.EXTRACT);

  const [targetOpinions, bill] = await Promise.all([
    fetchTargetOpinions(billId),
    fetchBillContext(billId),
  ]);

  const candidates = await extractTopics(targetOpinions, bill);
  await saveProgress(versionId, {
    bill,
    target_opinions: targetOpinions,
    candidates,
  });
}

/** Phase2: 候補を統合し最終トピック（ローカルID付き）を progress 保存。 */
async function executeMerge(versionId: string): Promise<void> {
  await updateVersionStep(versionId, ANALYSIS_STEPS.MERGE);
  const progress = await loadProgress(versionId);

  const merged = await mergeTopics(progress.candidates ?? [], progress.bill);
  const finalTopics: FinalTopicWithId[] = merged.map((t, i) => ({
    ...t,
    local_id: `t${i}`,
  }));

  await saveProgress(versionId, { ...progress, final_topics: finalTopics });
}

/** Phase3: 意見を割当し、件数降順で topic / topic_opinion を保存 → 完了。 */
async function executeAssign(versionId: string): Promise<void> {
  await updateVersionStep(versionId, ANALYSIS_STEPS.ASSIGN);
  const progress = await loadProgress(versionId);
  // final_topics と同様、target_opinions も欠落時は空配列にフォールバックして
  // 非対称なクラッシュ（.length での TypeError 等）を避ける。
  const finalTopics = progress.final_topics ?? [];
  const targetOpinions = progress.target_opinions ?? [];

  const assignments = await assignOpinions(
    targetOpinions,
    finalTopics,
    progress.bill
  );

  const { sortedTopics, pairs } = buildSortedTopicsAndPairs(
    finalTopics,
    assignments
  );

  await saveTopicsAndAssignments(versionId, sortedTopics, pairs);
  await finalizeVersion(versionId, targetOpinions.length);
  // version が完了してから抽出済みを記録する（finalize 後に置く理由は増分側と同じ）。
  // フル分析では全対象意見を抽出済みにし、以後の増分で「新規」として再抽出されないようにする。
  await markExtractedBestEffort(targetOpinions.map((o) => o.opinion_id));
  await autoPublish(versionId);
}

async function runFullAnalysis(
  versionId: string,
  billId: string
): Promise<void> {
  await executeExtract(versionId, billId);
  console.log(`[topic-analysis] extract done version=${versionId}`);
  await executeMerge(versionId);
  console.log(`[topic-analysis] merge done version=${versionId}`);
  await executeAssign(versionId);
}

// ── 増分分析（新規意見のみ抽出し、既存トピックへ差分追加） ──

/**
 * 既定動作（§7）: completed したら自動公開（旧公開版は降ろす）。公開は付帯処理なので
 * 失敗しても version を failed に倒さない（best-effort）。未公開なら Admin 手動公開で復旧可。
 */
async function autoPublish(versionId: string): Promise<void> {
  try {
    await publishVersion(versionId);
  } catch (error) {
    console.error(
      `[UserTopicAnalysis] auto-publish failed (version ${versionId} stays completed):`,
      error
    );
  }
}

/**
 * 抽出済みウォーターマークの記録（best-effort）。version 完了後の付帯処理なので、
 * ここで失敗しても完了した version を failed に倒さない。失敗時は当該意見が次回
 * 「新規」として再抽出されるだけ（重複コストのみで、データ欠落や取りこぼしは起きない）。
 */
async function markExtractedBestEffort(opinionIds: string[]): Promise<void> {
  if (opinionIds.length === 0) return;
  try {
    await markOpinionsExtracted(opinionIds);
  } catch (error) {
    console.error(
      `[UserTopicAnalysis] mark-extracted failed (version stays completed):`,
      error
    );
  }
}

/**
 * 増分分析: 「まだ抽出されていない新規意見」だけからトピック候補を抽出し、
 * 既存トピックと突き合わせて明確に新規のものだけ追加、未割当意見を（既存＋新規）トピックへ割り当てる。
 * 既存トピックのタイトル・説明・既存割当は引き継ぎ（凍結）、毎回新しい version を作る。
 * 前回 completed version が無ければフル分析にフォールバックする。
 */
async function runIncrementalAnalysis(
  versionId: string,
  billId: string
): Promise<void> {
  const versions = await listVersionsByBill(billId);
  const prev = versions.find(
    (v) => v.status === "completed" && v.id !== versionId
  );
  // 初回（前回完了版なし）はフル分析と等価。
  if (!prev) {
    console.log(
      `[topic-analysis] no previous version, fallback to full version=${versionId}`
    );
    await runFullAnalysis(versionId, billId);
    return;
  }

  await updateVersionStatus(versionId, "running");
  await updateVersionStep(versionId, ANALYSIS_STEPS.EXTRACT);

  const [allTargets, bill] = await Promise.all([
    fetchTargetOpinions(billId),
    fetchBillContext(billId),
  ]);
  const existing = toExistingTopics(await getTopicsWithOpinions(prev.id));
  const unextracted = selectUnextractedOpinions(allTargets);

  // Step1-2: 新規意見のみ抽出 → 新規同士で統合 → 既存と突き合わせて採否判定。
  let acceptedNew: TopicDraft[] = [];
  if (unextracted.length > 0) {
    const candidates = await extractTopics(unextracted, bill);
    await updateVersionStep(versionId, ANALYSIS_STEPS.MERGE);
    const mergedNew = await mergeTopics(candidates, bill);
    acceptedNew = await judgeNewTopics(mergedNew, existing, bill);
  }
  console.log(
    `[topic-analysis] incremental: new opinions=${unextracted.length} accepted topics=${acceptedNew.length} version=${versionId}`
  );

  // Step3: 既存を引き継ぎ、未割当（新規＋前回未割当）を全トピックへ割当。
  const { finalTopics, carriedAssignments, unassignedOpinions } =
    buildIncrementalPlan(existing, acceptedNew, allTargets);

  await updateVersionStep(versionId, ANALYSIS_STEPS.ASSIGN);
  const newAssignments = await assignOpinions(
    unassignedOpinions,
    finalTopics,
    bill
  );
  const { sortedTopics, pairs } = buildSortedTopicsAndPairs(finalTopics, [
    ...carriedAssignments,
    ...newAssignments,
  ]);

  await saveTopicsAndAssignments(versionId, sortedTopics, pairs);
  await finalizeVersion(versionId, allTargets.length);
  // version が完了(known-good)になってから抽出済みを記録する。finalize 前に記録すると、
  // finalize 失敗時に「未保存なのに抽出済み」になり、新規意見が次回以降に再抽出されず
  // 新トピックが二度と提案されなくなるため（completed 後に置く）。
  await markExtractedBestEffort(unextracted.map((o) => o.opinion_id));
  await autoPublish(versionId);
}

/**
 * トピック分析を1バージョン分、最後まで実行する（Cloud Run Job のメイン処理）。
 * strategy=full（既定）は全意見を再分析、incremental は新規意見のみ差分追加する。
 * version 行は呼び出し側（admin）で作成済みの前提で、その id を受け取る。
 * 失敗時は version を failed にして再 throw する。
 */
export async function runAnalysis(
  versionId: string,
  billId: string,
  strategy: AnalysisStrategy = "full"
): Promise<void> {
  console.log(
    `[topic-analysis] start analysis version=${versionId} bill=${billId} strategy=${strategy}`
  );
  try {
    if (strategy === "incremental") {
      await runIncrementalAnalysis(versionId, billId);
    } else {
      await runFullAnalysis(versionId, billId);
    }
    console.log(`[topic-analysis] analysis completed version=${versionId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(
      `[topic-analysis] analysis failed version=${versionId}: ${message}`
    );
    await updateVersionStatus(versionId, "failed", message);
    throw error;
  }
}

/**
 * 全議案に対してトピック分析を順次実行する（1 Cloud Run 実行で全議案ループ）。
 * - 有効な対象意見が0件の議案はスキップ（version を作らない）。
 * - incremental かつ「前回完了版があり新規意見が無い」議案はスキップ（無駄な再分析を避ける）。
 * - createVersion が null（実行中の版が既存＝多重起動ガード）なら skip。
 * - 1議案の失敗は全体を止めず、次の議案へ進む。
 */
export async function runAnalyzeAll(
  strategy: AnalysisStrategy = "incremental"
): Promise<void> {
  const bills = await listAllBills();
  const total = bills.length;
  console.log(
    `[topic-analysis] start analyze-all bills=${total} strategy=${strategy}`
  );
  let analyzed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < total; i++) {
    const { id: billId, name } = bills[i];
    // 全体進捗（何件目／全何件）と議案ごとの開始・終了をログに出す（議案はタイトルで表示）。
    const progress = `${i + 1}/${total}`;
    console.log(
      `[topic-analysis] analyze-all (${progress}) start 議案=${name}`
    );
    try {
      const targets = await fetchTargetOpinions(billId);
      if (targets.length === 0) {
        skipped++;
        console.log(
          `[topic-analysis] analyze-all (${progress}) skip 議案=${name} (対象意見なし)`
        );
        continue;
      }
      if (strategy === "incremental") {
        const versions = await listVersionsByBill(billId);
        const hasCompleted = versions.some((v) => v.status === "completed");
        const hasNew = selectUnextractedOpinions(targets).length > 0;
        // 既に分析済みで新規意見が無ければ何もしない。
        if (hasCompleted && !hasNew) {
          skipped++;
          console.log(
            `[topic-analysis] analyze-all (${progress}) skip 議案=${name} (新規意見なし)`
          );
          continue;
        }
      }
      const version = await createVersion(
        billId,
        "manual",
        TOPIC_MODEL,
        PROMPT_VERSION
      );
      if (!version) {
        // 実行中/保留中の版が既にある（one_active_version_per_bill）。
        skipped++;
        console.log(
          `[topic-analysis] analyze-all (${progress}) skip 議案=${name} (実行中の版あり)`
        );
        continue;
      }
      await runAnalysis(version.id, billId, strategy);
      analyzed++;
      console.log(
        `[topic-analysis] analyze-all (${progress}) done 議案=${name} version=${version.id}`
      );
    } catch (error) {
      failed++;
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(
        `[topic-analysis] analyze-all (${progress}) failed 議案=${name}: ${message}`
      );
    }
  }

  console.log(
    `[topic-analysis] analyze-all done: analyzed=${analyzed} skipped=${skipped} failed=${failed} (bills=${total}) strategy=${strategy}`
  );
}
