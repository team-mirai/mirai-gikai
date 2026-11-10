import { isMiraiStancePublished } from "@mirai-gikai/shared/mirai-stance/publish-schedule";
import type { BillMilestoneFact, BillMilestoneSource } from "../types";

/** null を無視して新しい方の日時を返す（SQL の greatest と同じ） */
export function latestTimestamp(...values: (string | null)[]): string | null {
  return values.reduce<string | null>((latest, value) => {
    if (value === null) return latest;
    if (latest === null) return value;
    return new Date(value) > new Date(latest) ? value : latest;
  }, null);
}

function toStanceFact(
  stance: BillMilestoneSource["mirai_stances"],
  now: Date
): BillMilestoneFact["stance"] {
  if (!stance) return null;
  return {
    type: stance.type,
    isPublished: isMiraiStancePublished(stance, now),
    // 予約公開なら publish_at の方が新しく、実際に表に出た日時になる
    publishedAt: latestTimestamp(stance.published_at, stance.publish_at),
  };
}

function toInterviewFact(
  configs: BillMilestoneSource["interview_configs"]
): BillMilestoneFact["interview"] {
  const publicConfigs = configs.filter(
    (config) => config.deleted_at === null && config.status === "public"
  );
  if (publicConfigs.length === 0) return { isPublic: false, publishedAt: null };
  return {
    isPublic: true,
    publishedAt: latestTimestamp(
      ...publicConfigs.map((config) => config.published_at)
    ),
  };
}

export function buildBillMilestoneFact(
  source: BillMilestoneSource,
  params: { now: Date; webUrl: string }
): BillMilestoneFact {
  const billUrl = `${params.webUrl}/bills/${source.id}`;
  return {
    billId: source.id,
    name: source.name,
    slug: source.slug,
    easyTitle:
      source.bill_contents.find(
        (content) => content.difficulty_level === "normal"
      )?.title ?? null,
    originatingHouse: source.originating_house,
    status: source.status,
    publishStatus: source.publish_status,
    articleKind: source.article_kind,
    firstPublishedAt: source.first_published_at,
    statusChanges: [...source.status_changes]
      .sort(
        (a, b) =>
          new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
      )
      .map((change) => ({
        from: change.from_status,
        to: change.to_status,
        changedAt: change.changed_at,
      })),
    stance: toStanceFact(source.mirai_stances, params.now),
    interview: toInterviewFact(source.interview_configs),
    urls: { bill: billUrl, interview: `${billUrl}/interview` },
  };
}
