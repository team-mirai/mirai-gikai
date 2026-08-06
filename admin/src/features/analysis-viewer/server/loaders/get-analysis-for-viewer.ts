import "server-only";

import { normalizeReasoningTypes } from "@mirai-gikai/shared/interview-report/opinion-tags";
import { listVersionsByBill } from "@mirai-gikai/topic-analysis-core/repository";
import type { RawViewerTopic } from "../../shared/types";
import { findAnalysisTopics } from "../repositories/analysis-viewer-repository";

/**
 * ビューアに出す分析（最新の完了版）をトピック・意見・タグ込みで取得する。
 *
 * 表示できない意見（管理者非公開・同意撤回・モデレーション ng）はここで落とす。
 * 割当は分析実行時点のスナップショットなので、読み出しのたびに再判定しないと
 * 撤回済みの発言が残る。公開側（build-public-topic-analysis の isDisplayable）と
 * 同じ判定を admin でも通す。
 *
 * audience の絞り込みはここでは行わない。`role`（interview_report）と
 * `reasoning_types`（interview_opinion）をまたぐ OR は PostgREST で書けないため、
 * 純粋関数（buildViewerHierarchy）側で絞る。
 */
export async function getAnalysisForViewer(billId: string): Promise<{
  version: number;
  topics: RawViewerTopic[];
} | null> {
  const versions = await listVersionsByBill(billId);
  const latestCompleted = versions.find((v) => v.status === "completed");
  if (!latestCompleted) return null;

  const rows = await findAnalysisTopics(latestCompleted.id);

  const topics: RawViewerTopic[] = rows.map((topic) => ({
    id: topic.id,
    title: topic.title,
    description: topic.description,
    parent_topic_id: topic.parent_topic_id,
    opinions: (topic.topic_opinion ?? []).flatMap((link) => {
      const opinion = link.interview_opinion;
      if (!opinion) return [];

      const report = opinion.interview_report;
      const displayable =
        report?.is_public_by_admin === true &&
        report?.is_public_by_user === true &&
        report?.moderation_status === "ok";
      if (!displayable) return [];

      return [
        {
          id: opinion.id,
          title: opinion.title,
          content: opinion.content,
          contextualQuote: opinion.contextual_quote,
          billSentiment: toBillSentiment(opinion.bill_sentiment),
          richness: opinion.richness,
          concern: emptyToNull(opinion.concern),
          proposal: emptyToNull(opinion.proposal),
          reasoningTypes: normalizeReasoningTypes(opinion.reasoning_types),
          role: report.role,
          roleTitle: report.role_title,
        },
      ];
    }),
  }));

  return { version: latestCompleted.version, topics };
}

/** LLM が想定外の値を入れた場合に生値を画面へ出さない。 */
function toBillSentiment(value: string | null): "期待" | "懸念" | null {
  return value === "期待" || value === "懸念" ? value : null;
}

/** 空文字・空白のみは null に寄せる（懸念/提案の一覧に空行が並ぶのを防ぐ）。 */
function emptyToNull(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
