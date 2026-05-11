import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "@test-utils/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getInterviewConfigAdmin } from "./get-interview-config-admin";

describe("getInterviewConfigAdmin 統合テスト", () => {
  let billId: string;

  beforeEach(async () => {
    const bill = await createTestBill();
    billId = bill.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
  });

  describe("configId を指定した場合", () => {
    it("指定した configId の設定をそのまま返す（非公開設定でも取得できる）", async () => {
      const { data: closedConfig, error } = await adminClient
        .from("interview_configs")
        .insert({
          bill_id: billId,
          status: "closed",
          name: `編集中設定 ${Date.now()}`,
        })
        .select()
        .single();
      if (!closedConfig)
        throw new Error(`closed config 作成失敗: ${error?.message}`);

      const result = await getInterviewConfigAdmin(billId, closedConfig.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(closedConfig.id);
      expect(result?.status).toBe("closed");
    });

    it("configId が他の bill に紐づく場合は null を返す", async () => {
      const otherBill = await createTestBill();
      try {
        const { data: otherConfig, error } = await adminClient
          .from("interview_configs")
          .insert({
            bill_id: otherBill.id,
            status: "closed",
            name: `他法案の設定 ${Date.now()}`,
          })
          .select()
          .single();
        if (!otherConfig)
          throw new Error(`other config 作成失敗: ${error?.message}`);

        const result = await getInterviewConfigAdmin(billId, otherConfig.id);

        expect(result).toBeNull();
      } finally {
        await cleanupTestBill(otherBill.id);
      }
    });

    it("存在しない configId の場合は null を返す", async () => {
      const result = await getInterviewConfigAdmin(
        billId,
        "00000000-0000-0000-0000-000000000000"
      );

      expect(result).toBeNull();
    });
  });

  describe("configId を指定しない場合", () => {
    it("公開中の設定があれば公開中の設定を返す", async () => {
      const { data: publicConfig } = await adminClient
        .from("interview_configs")
        .insert({
          bill_id: billId,
          status: "public",
          name: `公開設定 ${Date.now()}`,
        })
        .select()
        .single();
      if (!publicConfig) throw new Error("public config 作成失敗");

      // 同じ bill に別の closed 設定も作成しておく（こちらは返されてはいけない）
      await adminClient.from("interview_configs").insert({
        bill_id: billId,
        status: "closed",
        name: `編集中設定 ${Date.now()}`,
      });

      const result = await getInterviewConfigAdmin(billId);

      expect(result?.id).toBe(publicConfig.id);
      expect(result?.status).toBe("public");
    });

    it("公開設定が無い場合は最新の設定を返す", async () => {
      const { data: olderConfig, error: olderError } = await adminClient
        .from("interview_configs")
        .insert({
          bill_id: billId,
          status: "closed",
          name: "旧設定",
          updated_at: new Date(Date.now() - 60_000).toISOString(),
        })
        .select()
        .single();
      if (!olderConfig)
        throw new Error(`older config 作成失敗: ${olderError?.message}`);

      const { data: newerConfig, error: newerError } = await adminClient
        .from("interview_configs")
        .insert({
          bill_id: billId,
          status: "closed",
          name: "新設定",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (!newerConfig)
        throw new Error(`newer config 作成失敗: ${newerError?.message}`);

      const result = await getInterviewConfigAdmin(billId);

      expect(result?.id).toBe(newerConfig.id);
    });

    it("公開設定も他の設定も無い場合は null を返す", async () => {
      const result = await getInterviewConfigAdmin(billId);

      expect(result).toBeNull();
    });
  });
});
