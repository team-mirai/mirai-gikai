import {
  adminClient,
  cleanupTestBill,
  createTestBill,
} from "@test-utils/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type SubmitArticleReportDeps,
  submitArticleReportCore,
} from "./submit-article-report-core";

describe("submitArticleReportCore 統合テスト", () => {
  const billIds: string[] = [];
  let baseDeps: SubmitArticleReportDeps;

  // 全体枠を他のテストや実運用のキーと共有しないよう、毎回別のキーを使う
  beforeEach(() => {
    baseDeps = {
      clientIp: "203.0.113.1",
      now: new Date(),
      adminUrl: "https://admin.example.com",
      rateLimitKeyPrefix: `test-article-report-${crypto.randomUUID()}`,
    };
  });

  afterEach(async () => {
    for (const id of billIds) {
      await cleanupTestBill(id);
    }
    billIds.length = 0;
  });

  async function createBill(
    overrides: Parameters<typeof createTestBill>[0] = {}
  ) {
    const bill = await createTestBill({
      publish_status: "published",
      article_kind: "ai_generated",
      ...overrides,
    });
    billIds.push(bill.id);
    return bill;
  }

  async function findReports(billId: string) {
    const { data, error } = await adminClient
      .from("bill_article_reports")
      .select("*")
      .eq("bill_id", billId);
    if (error) throw new Error(error.message);
    return data;
  }

  it("公開中のAI版記事への報告を保存し、Slack に通知する", async () => {
    const bill = await createBill({ name: "通知テスト議案" });
    const notified: string[] = [];

    const result = await submitArticleReportCore(
      {
        billId: bill.id,
        difficultyLevel: "hard",
        category: "outdated",
        body: "  数字が古いです  ",
      },
      {
        ...baseDeps,
        notify: async (text) => {
          notified.push(text);
        },
      }
    );

    expect(result).toEqual({ ok: true });
    const reports = await findReports(bill.id);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      difficulty_level: "hard",
      category: "outdated",
      body: "数字が古いです",
    });
    expect(notified).toHaveLength(1);
    expect(notified[0]).toContain("議案: 通知テスト議案");
    expect(notified[0]).toContain(
      `https://admin.example.com/bills/${bill.id}/article-reports`
    );
  });

  it("種類なしでも保存できる", async () => {
    const bill = await createBill();

    const result = await submitArticleReportCore(
      { billId: bill.id, difficultyLevel: "normal", body: "わかりにくい" },
      baseDeps
    );

    expect(result).toEqual({ ok: true });
    const reports = await findReports(bill.id);
    expect(reports[0]?.category).toBeNull();
  });

  it("Slack 通知に失敗しても送信は成功扱いにする", async () => {
    const bill = await createBill();

    const result = await submitArticleReportCore(
      { billId: bill.id, difficultyLevel: "normal", body: "誤りです" },
      {
        ...baseDeps,
        notify: async () => {
          throw new Error("webhook down");
        },
      }
    );

    expect(result).toEqual({ ok: true });
    expect(await findReports(bill.id)).toHaveLength(1);
  });

  it("通常版の記事への報告は受け付けない", async () => {
    const bill = await createBill({ article_kind: "standard" });

    const result = await submitArticleReportCore(
      { billId: bill.id, difficultyLevel: "normal", body: "誤りです" },
      baseDeps
    );

    expect(result.ok).toBe(false);
    expect(await findReports(bill.id)).toHaveLength(0);
  });

  it("非公開の記事への報告は受け付けない", async () => {
    const bill = await createBill({ publish_status: "draft" });

    const result = await submitArticleReportCore(
      { billId: bill.id, difficultyLevel: "normal", body: "誤りです" },
      baseDeps
    );

    expect(result.ok).toBe(false);
    expect(await findReports(bill.id)).toHaveLength(0);
  });

  it("同一IPから6件目は送信が多すぎる旨を返す", async () => {
    const bill = await createBill();
    const input = {
      billId: bill.id,
      difficultyLevel: "normal",
      body: "誤りです",
    };

    for (let i = 0; i < 5; i++) {
      expect(await submitArticleReportCore(input, baseDeps)).toEqual({
        ok: true,
      });
    }

    expect(await submitArticleReportCore(input, baseDeps)).toEqual({
      ok: false,
      error: "送信が多すぎます。しばらく待ってから再度お試しください",
    });
    expect(await findReports(bill.id)).toHaveLength(5);
  });
});
