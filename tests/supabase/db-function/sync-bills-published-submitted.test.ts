import { afterEach, describe, expect, it } from "vitest";
import { adminClient, cleanupTestBill } from "../utils";

describe("sync_bills_published_submitted トリガー", () => {
  const billIds: string[] = [];

  afterEach(async () => {
    for (const id of billIds) {
      await cleanupTestBill(id);
    }
    billIds.length = 0;
  });

  describe("INSERT", () => {
    it("submitted_date のみ指定すると published_at に同期される", async () => {
      const timestamp = "2026-04-01T09:00:00+00:00";
      const { data, error } = await adminClient
        .from("bills")
        .insert({
          name: `テスト議案 ${Date.now()}`,
          originating_house: "HR" as const,
          status: "introduced" as const,
          submitted_date: timestamp,
        })
        .select("id, submitted_date, published_at")
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      billIds.push(data!.id);
      expect(data!.submitted_date).toBe(timestamp);
      expect(data!.published_at).toBe(timestamp);
    });

    it("published_at のみ指定すると submitted_date に同期される", async () => {
      const timestamp = "2026-04-02T09:00:00+00:00";
      const { data, error } = await adminClient
        .from("bills")
        .insert({
          name: `テスト議案 ${Date.now()}`,
          originating_house: "HR" as const,
          status: "introduced" as const,
          published_at: timestamp,
        })
        .select("id, submitted_date, published_at")
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      billIds.push(data!.id);
      expect(data!.published_at).toBe(timestamp);
      expect(data!.submitted_date).toBe(timestamp);
    });

    it("両方NULLの場合はNULLのまま", async () => {
      const { data, error } = await adminClient
        .from("bills")
        .insert({
          name: `テスト議案 ${Date.now()}`,
          originating_house: "HR" as const,
          status: "introduced" as const,
        })
        .select("id, submitted_date, published_at")
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      billIds.push(data!.id);
      expect(data!.submitted_date).toBeNull();
      expect(data!.published_at).toBeNull();
    });
  });

  describe("UPDATE", () => {
    it("submitted_date を変更すると published_at に同期される", async () => {
      const { data: bill } = await adminClient
        .from("bills")
        .insert({
          name: `テスト議案 ${Date.now()}`,
          originating_house: "HR" as const,
          status: "introduced" as const,
        })
        .select("id")
        .single();
      billIds.push(bill!.id);

      const newTimestamp = "2026-05-01T10:00:00+00:00";
      const { error } = await adminClient
        .from("bills")
        .update({ submitted_date: newTimestamp })
        .eq("id", bill!.id);
      expect(error).toBeNull();

      const { data: updated } = await adminClient
        .from("bills")
        .select("submitted_date, published_at")
        .eq("id", bill!.id)
        .single();

      expect(updated!.submitted_date).toBe(newTimestamp);
      expect(updated!.published_at).toBe(newTimestamp);
    });

    it("published_at を変更すると submitted_date に同期される", async () => {
      const { data: bill } = await adminClient
        .from("bills")
        .insert({
          name: `テスト議案 ${Date.now()}`,
          originating_house: "HR" as const,
          status: "introduced" as const,
        })
        .select("id")
        .single();
      billIds.push(bill!.id);

      const newTimestamp = "2026-06-01T10:00:00+00:00";
      const { error } = await adminClient
        .from("bills")
        .update({ published_at: newTimestamp })
        .eq("id", bill!.id);
      expect(error).toBeNull();

      const { data: updated } = await adminClient
        .from("bills")
        .select("submitted_date, published_at")
        .eq("id", bill!.id)
        .single();

      expect(updated!.published_at).toBe(newTimestamp);
      expect(updated!.submitted_date).toBe(newTimestamp);
    });

    it("両カラム同時変更時は submitted_date が優先される", async () => {
      const initialTimestamp = "2026-04-01T09:00:00+00:00";
      const { data: bill } = await adminClient
        .from("bills")
        .insert({
          name: `テスト議案 ${Date.now()}`,
          originating_house: "HR" as const,
          status: "introduced" as const,
          submitted_date: initialTimestamp,
        })
        .select("id")
        .single();
      billIds.push(bill!.id);

      const submittedValue = "2026-07-01T10:00:00+00:00";
      const publishedValue = "2026-08-01T10:00:00+00:00";
      const { error } = await adminClient
        .from("bills")
        .update({
          submitted_date: submittedValue,
          published_at: publishedValue,
        })
        .eq("id", bill!.id);
      expect(error).toBeNull();

      const { data: updated } = await adminClient
        .from("bills")
        .select("submitted_date, published_at")
        .eq("id", bill!.id)
        .single();

      // submitted_date が優先される
      expect(updated!.submitted_date).toBe(submittedValue);
      expect(updated!.published_at).toBe(submittedValue);
    });
  });
});
