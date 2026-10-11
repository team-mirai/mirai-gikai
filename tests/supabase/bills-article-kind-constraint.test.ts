import { afterAll, describe, expect, it } from "vitest";
import { adminClient, cleanupTestBill, createTestBill } from "./utils";

const CHECK_VIOLATION = "23514";

describe("bills の article_kind と is_review_completed の整合性制約", () => {
  const createdBillIds: string[] = [];

  afterAll(async () => {
    for (const id of createdBillIds) {
      await cleanupTestBill(id);
    }
  });

  async function insertBill(
    articleKind: "standard" | "ai_generated",
    isReviewCompleted: boolean
  ) {
    const result = await adminClient
      .from("bills")
      .insert({
        name: `article_kind 制約テスト ${Date.now()}`,
        originating_house: "HR",
        status: "introduced",
        publish_status: "draft",
        article_kind: articleKind,
        is_review_completed: isReviewCompleted,
      })
      .select("id")
      .single();
    if (result.data) createdBillIds.push(result.data.id);
    return result;
  }

  it("ai_generated かつレビュー完了の insert は拒否される", async () => {
    const { error } = await insertBill("ai_generated", true);
    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("standard かつレビュー完了の insert は成功する", async () => {
    const { error } = await insertBill("standard", true);
    expect(error).toBeNull();
  });

  it("ai_generated かつレビュー未完了の insert は成功する", async () => {
    const { error } = await insertBill("ai_generated", false);
    expect(error).toBeNull();
  });

  it("ai_generated の記事をレビュー完了に update すると拒否される", async () => {
    const bill = await createTestBill({ article_kind: "ai_generated" });
    createdBillIds.push(bill.id);

    const { error } = await adminClient
      .from("bills")
      .update({ is_review_completed: true })
      .eq("id", bill.id);

    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("レビュー完了の記事を ai_generated に update すると拒否される", async () => {
    const bill = await createTestBill({ is_review_completed: true });
    createdBillIds.push(bill.id);

    const { error } = await adminClient
      .from("bills")
      .update({ article_kind: "ai_generated" })
      .eq("id", bill.id);

    expect(error?.code).toBe(CHECK_VIOLATION);
  });

  it("standard への切り替えとレビュー完了を同時に行う update は成功する", async () => {
    const bill = await createTestBill({ article_kind: "ai_generated" });
    createdBillIds.push(bill.id);

    const { error } = await adminClient
      .from("bills")
      .update({ article_kind: "standard", is_review_completed: true })
      .eq("id", bill.id);

    expect(error).toBeNull();
  });
});
