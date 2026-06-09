import "server-only";

import { ANALYSIS_STEPS } from "../../shared/constants";
import type { FinalTopicWithId } from "../../shared/types";
import { buildSortedTopicsAndPairs } from "../../shared/utils/build-sorted-topics";
import {
  fetchBillContext,
  fetchTargetOpinions,
  finalizeVersion,
  loadProgress,
  saveProgress,
  saveTopicsAndAssignments,
  updateVersionStatus,
  updateVersionStep,
} from "../repositories/user-topic-analysis-repository";
import { assignOpinions } from "./assign-opinions";
import { extractTopics } from "./extract-topics";
import { mergeTopics } from "./merge-topics";

/** Phase1: 対象意見・議案を取得しトピック候補を抽出 → progress 保存。 */
export async function executeExtract(
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
export async function executeMerge(versionId: string): Promise<void> {
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
export async function executeAssign(versionId: string): Promise<void> {
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
}
