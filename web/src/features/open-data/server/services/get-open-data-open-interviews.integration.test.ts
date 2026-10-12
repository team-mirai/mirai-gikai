import {
  adminClient,
  cleanupTestBill,
  createTestBill,
  createTestBillContent,
} from "@test-utils/utils";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getOpenDataOpenInterviews } from "./get-open-data-open-interviews";

async function createInterviewConfig(
  billId: string,
  overrides: Partial<{
    status: "public" | "closed";
    estimated_duration: number | null;
    created_at: string;
    deleted_at: string | null;
  }> = {}
) {
  const { data, error } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: billId,
      name: `テスト設定 ${Date.now()}`,
      status: "public",
      ...overrides,
    })
    .select()
    .single();
  if (error) throw new Error(`interview_config 作成失敗: ${error.message}`);
  return data;
}

/**
 * 受付中インタビュー一覧のサービスを実DBで検証する。
 * ローカルDBには他の議案が存在し得るため、検証はこのテストで作成した
 * 議案の行だけに絞って行う。
 */
describe("getOpenDataOpenInterviews", () => {
  let newerBillId: string;
  let olderBillId: string;
  let closedBillId: string;
  let deletedBillId: string;
  let draftBillId: string;
  let hardOnlyBillId: string;

  beforeAll(async () => {
    const newer = await createTestBill({ publish_status: "published" });
    newerBillId = newer.id;
    await adminClient
      .from("bills")
      .update({ thumbnail_url: "https://example.com/thumb.png" })
      .eq("id", newerBillId);
    await createTestBillContent(newerBillId, {
      difficulty_level: "normal",
      title: "ふつうタイトル",
      summary: "ふつう概要",
    });
    await createTestBillContent(newerBillId, {
      difficulty_level: "hard",
      title: "難しいタイトル",
      summary: "難しい概要",
    });
    // 同じ議案の終了済み設定は、公開中の設定と並んでも返さない
    await createInterviewConfig(newerBillId, { status: "closed" });
    await createInterviewConfig(newerBillId, {
      estimated_duration: 15,
      created_at: "2026-10-02T00:00:00+00:00",
    });

    const older = await createTestBill({ publish_status: "published" });
    olderBillId = older.id;
    await createTestBillContent(olderBillId, { difficulty_level: "normal" });
    await createInterviewConfig(olderBillId, {
      created_at: "2026-10-01T00:00:00+00:00",
    });

    // 以下はいずれも受付中ではない
    const closed = await createTestBill({ publish_status: "published" });
    closedBillId = closed.id;
    await createTestBillContent(closedBillId, { difficulty_level: "normal" });
    await createInterviewConfig(closedBillId, { status: "closed" });

    const deleted = await createTestBill({ publish_status: "published" });
    deletedBillId = deleted.id;
    await createTestBillContent(deletedBillId, { difficulty_level: "normal" });
    await createInterviewConfig(deletedBillId, {
      deleted_at: new Date().toISOString(),
    });

    const draft = await createTestBill({ publish_status: "draft" });
    draftBillId = draft.id;
    await createTestBillContent(draftBillId, { difficulty_level: "normal" });
    await createInterviewConfig(draftBillId);

    // 指定難易度のコンテンツが無い議案は、その難易度では返さない
    const hardOnly = await createTestBill({ publish_status: "published" });
    hardOnlyBillId = hardOnly.id;
    await createTestBillContent(hardOnlyBillId, { difficulty_level: "hard" });
    await createInterviewConfig(hardOnlyBillId, {
      created_at: "2026-09-30T00:00:00+00:00",
    });
  });

  afterAll(async () => {
    for (const billId of [
      newerBillId,
      olderBillId,
      closedBillId,
      deletedBillId,
      draftBillId,
      hardOnlyBillId,
    ]) {
      await cleanupTestBill(billId);
    }
  });

  const mine = (items: { billId: string }[]) =>
    items.filter((item) =>
      [
        newerBillId,
        olderBillId,
        closedBillId,
        deletedBillId,
        draftBillId,
        hardOnlyBillId,
      ].includes(item.billId)
    );

  it("受付中のインタビューだけを新しい順に返す", async () => {
    const { items } = await getOpenDataOpenInterviews({
      difficulty: "normal",
    });

    expect(mine(items).map((item) => item.billId)).toEqual([
      newerBillId,
      olderBillId,
    ]);
  });

  it("議案のタイトル・概要・サムネイル、目安時間、インタビューページのURLを返す", async () => {
    const { items } = await getOpenDataOpenInterviews({
      difficulty: "normal",
    });
    const item = items.find((i) => i.billId === newerBillId);

    expect(item).toMatchObject({
      title: "ふつうタイトル",
      summary: "ふつう概要",
      thumbnailUrl: "https://example.com/thumb.png",
      estimatedDurationMinutes: 15,
    });
    expect(item?.interviewUrl).toMatch(
      new RegExp(`/bills/${newerBillId}/interview$`)
    );
  });

  it("難易度に応じたコンテンツを返す", async () => {
    const { items } = await getOpenDataOpenInterviews({ difficulty: "hard" });

    expect(mine(items).map((item) => item.billId)).toEqual([
      newerBillId,
      hardOnlyBillId,
    ]);
    expect(items.find((i) => i.billId === newerBillId)?.title).toBe(
      "難しいタイトル"
    );
  });
});
