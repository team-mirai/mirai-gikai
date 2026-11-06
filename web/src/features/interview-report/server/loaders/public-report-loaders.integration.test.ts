import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  getInitialPublicReportsByBillId,
  getPublicReportsByBillIdPaginated,
  PAGE_SIZE,
} from "./get-all-public-reports-by-bill-id";
import { getPublicReportById } from "./get-public-report-by-id";
import { getPublicReportsByBillId } from "./get-public-reports-by-bill-id";
import { getReportOgData } from "./get-report-og-data";
import { getReportWithMessages } from "./get-report-with-messages";
import {
  cleanupPublicReportLoaderContext,
  createPublicReport,
  createPublicReportLoaderContext,
  createPublicReports,
  type PublicReportLoaderContext,
} from "./public-report-loader.integration-test-utils";

describe("公開レポート loader 統合テスト", () => {
  let context: PublicReportLoaderContext | null = null;

  afterEach(async () => {
    await cleanupPublicReportLoaderContext(context);
    context = null;
  });

  // 件数による下限は撤去した。1件でも法案詳細に出す。
  it("公開が1件でも法案詳細用レポートを返す", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, 1);

    const result = await getPublicReportsByBillId(context.billId);

    expect(result.totalCount).toBe(1);
    expect(result.reports).toHaveLength(1);
  });

  it("法案詳細用は最大3件と総件数を返す", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, 20);

    const result = await getPublicReportsByBillId(context.billId);

    expect(result.totalCount).toBe(20);
    expect(result.reports).toHaveLength(3);
    expect(result.reports.every((report) => report.stance === "for")).toBe(
      true
    );
  });

  it("公開が無ければ空の stance counts を返す", async () => {
    context = await createPublicReportLoaderContext();

    await expect(
      getInitialPublicReportsByBillId(context.billId)
    ).resolves.toEqual({
      reports: [],
      stanceCounts: { all: 0, for: 0, against: 0, neutral: 0 },
      hasMore: false,
    });
  });

  it("初期ページはスタンス別件数とフィルタ済みレポートを返す", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, 12, { stance: "for" });
    await createPublicReports(context, 5, { stance: "against" });
    await createPublicReports(context, 3, { stance: null });

    const result = await getInitialPublicReportsByBillId(
      context.billId,
      "for",
      "newest"
    );

    expect(result.stanceCounts).toEqual({
      all: 20,
      for: 12,
      against: 5,
      neutral: 0,
    });
    expect(result.reports).toHaveLength(12);
    expect(result.reports.every((report) => report.stance === "for")).toBe(
      true
    );
    expect(result.hasMore).toBe(false);
  });

  it("ページネーション loader は次ページを表示件数ゲート後に返す", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, PAGE_SIZE + 1);

    const result = await getPublicReportsByBillIdPaginated(
      context.billId,
      PAGE_SIZE,
      "for",
      "newest"
    );

    expect(result.reports).toHaveLength(1);
    expect(result.hasMore).toBe(false);
  });

  it("公開条件を満たさないレポートIDでは loader が null を返す（404扱い）", async () => {
    // 公開設定が削除された場合など、公開条件を満たすレポートが存在しないケース。
    // repository が PGRST116 で null を返し、各 loader はそれを null として扱う。
    const missingReportId = randomUUID();

    await expect(getPublicReportById(missingReportId)).resolves.toBeNull();
    await expect(getReportOgData(missingReportId)).resolves.toBeNull();
  });

  it("公開直リンク loader は表示可能なレポートとユーザー文字数を返す", async () => {
    context = await createPublicReportLoaderContext("統合テスト議案");
    const target = await createPublicReport(context, {
      messages: [
        { role: "user", content: "abc" },
        { role: "assistant", content: "ignored" },
        { role: "user", content: "de" },
      ],
    });
    const result = await getPublicReportById(target.report.id);

    expect(result?.bill_id).toBe(context.billId);
    expect(result?.bill.bill_content).toEqual({ title: "統合テスト議案" });
    expect(result?.characterCount).toBe(5);
  });

  it("OGP loader は公開レポートのデータを返す", async () => {
    context = await createPublicReportLoaderContext("OGP 議案");
    const target = await createPublicReport(context, { summary: "OGP 要約" });

    await expect(getReportOgData(target.report.id)).resolves.toEqual({
      // ヘルパーが summary に連番を付ける。
      summary: "OGP 要約-1",
      billName: "OGP 議案",
    });
  });

  it("チャットログ loader は非所有者にも公開レポートを返す", async () => {
    context = await createPublicReportLoaderContext("チャットログ議案");
    const target = await createPublicReport(context, {
      messages: [{ role: "user", content: "hello" }],
    });

    const result = await getReportWithMessages(target.report.id);

    expect(result?.report.bill_id).toBe(context.billId);
    expect(result?.messages).toHaveLength(1);
    expect(result?.bill.bill_content).toEqual({ title: "チャットログ議案" });
  });
});
