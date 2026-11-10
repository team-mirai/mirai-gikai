import "server-only";

import { fetchAllPages } from "@mirai-gikai/shared/db/fetch-all-pages";
import { createAdminClient } from "@mirai-gikai/supabase";
import { chunkArray } from "@/features/interview-reports/shared/utils/chunk-array";
import type { BillMilestoneSource } from "../../shared/types";
import { groupByBillId } from "../../shared/utils/group-by-bill-id";

/** 法案の詳細を取るときに、URL が長くなりすぎないよう ID を分けて問い合わせる件数 */
const BILL_ID_CHUNK_SIZE = 100;

function throwIfError(error: { message: string } | null, label: string): void {
  if (error) throw new Error(`Failed to fetch ${label}: ${error.message}`);
}

/**
 * since 以降に節目（初公開・審議状況の変化・賛否の公開・インタビューの公開）がある法案と、
 * 節目の事実を組み立てるのに使う関連テーブルの値を返す。審議状況の変化は since 以降のものだけ。
 * since は ISO 8601（タイムゾーン付き）
 */
export async function findBillMilestoneSourcesSince(
  since: string
): Promise<BillMilestoneSource[]> {
  const supabase = createAdminClient();
  const [publishedBills, statusChanges, stances, interviews] =
    await Promise.all([
      fetchAllPages(async (from, to) => {
        const { data, error } = await supabase
          .from("bills")
          .select("id")
          .gte("first_published_at", since)
          .order("id")
          .range(from, to);
        throwIfError(error, "published bills");
        return data ?? [];
      }),
      fetchAllPages(async (from, to) => {
        const { data, error } = await supabase
          .from("bill_status_changes")
          .select("bill_id, from_status, to_status, changed_at")
          .gte("changed_at", since)
          .order("id")
          .range(from, to);
        throwIfError(error, "bill status changes");
        return data ?? [];
      }),
      fetchAllPages(async (from, to) => {
        // 賛否の公開日時は greatest(published_at, publish_at)。予約公開で publish_at が未来のものも含める
        const { data, error } = await supabase
          .from("mirai_stances")
          .select("bill_id")
          .eq("is_published", true)
          .or(`published_at.gte.${since},publish_at.gte.${since}`)
          .order("id")
          .range(from, to);
        throwIfError(error, "published stances");
        return data ?? [];
      }),
      fetchAllPages(async (from, to) => {
        const { data, error } = await supabase
          .from("interview_configs")
          .select("bill_id")
          .is("deleted_at", null)
          .gte("published_at", since)
          .order("id")
          .range(from, to);
        throwIfError(error, "published interview configs");
        return data ?? [];
      }),
    ]);

  const changesByBillId = groupByBillId(statusChanges);
  const billIds = [
    ...new Set([
      ...publishedBills.map((row) => row.id),
      ...changesByBillId.keys(),
      ...stances.map((row) => row.bill_id),
      ...interviews.map((row) => row.bill_id),
    ]),
  ];

  const billChunks = await Promise.all(
    chunkArray(billIds, BILL_ID_CHUNK_SIZE).map(async (ids) => {
      const { data, error } = await supabase
        .from("bills")
        .select(
          "id, name, slug, originating_house, status, publish_status, article_kind, first_published_at, created_at, bill_contents(difficulty_level, title), mirai_stances(type, is_published, publish_at, published_at), interview_configs(status, published_at, deleted_at)"
        )
        .in("id", ids);
      throwIfError(error, "bills");
      return data ?? [];
    })
  );

  return billChunks
    .flat()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(({ created_at: _, ...bill }) => ({
      ...bill,
      status_changes: changesByBillId.get(bill.id) ?? [],
    }));
}
