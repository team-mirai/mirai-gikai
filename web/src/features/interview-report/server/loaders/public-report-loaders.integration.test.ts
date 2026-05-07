import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
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

  it("公開済み件数が表示閾値未満なら法案詳細用レポートを返さない", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1);

    await expect(getPublicReportsByBillId(context.billId)).resolves.toEqual({
      reports: [],
      totalCount: 0,
    });
  });

  it("公開済み件数が表示閾値以上なら法案詳細用に最大3件と総件数を返す", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY);

    const result = await getPublicReportsByBillId(context.billId);

    expect(result.totalCount).toBe(MIN_PUBLIC_REPORTS_FOR_DISPLAY);
    expect(result.reports).toHaveLength(3);
    expect(result.reports.every((report) => report.stance === "for")).toBe(
      true
    );
  });

  it("初期ページは公開済み件数が表示閾値未満なら空の stance counts を返す", async () => {
    context = await createPublicReportLoaderContext();
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1);

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
      all: MIN_PUBLIC_REPORTS_FOR_DISPLAY,
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

  it("公開直リンク loader は公開済み件数が表示閾値未満なら null を返す", async () => {
    context = await createPublicReportLoaderContext();
    const target = await createPublicReport(context);
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY - 2);

    await expect(getPublicReportById(target.report.id)).resolves.toBeNull();
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
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1);

    const result = await getPublicReportById(target.report.id);

    expect(result?.bill_id).toBe(context.billId);
    expect(result?.bill.bill_content).toEqual({ title: "統合テスト議案" });
    expect(result?.characterCount).toBe(5);
  });

  it("OGP loader は公開済み件数ゲートを満たす場合だけデータを返す", async () => {
    context = await createPublicReportLoaderContext("OGP 議案");
    const target = await createPublicReport(context, { summary: "OGP 要約" });
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY - 2);

    await expect(getReportOgData(target.report.id)).resolves.toBeNull();

    await createPublicReports(context, 1);

    await expect(getReportOgData(target.report.id)).resolves.toEqual({
      summary: "OGP 要約-1",
      billName: "OGP 議案",
    });
  });

  it("チャットログ loader は非所有者に公開済み件数ゲートを適用する", async () => {
    context = await createPublicReportLoaderContext("チャットログ議案");
    const target = await createPublicReport(context, {
      messages: [{ role: "user", content: "hello" }],
    });
    await createPublicReports(context, MIN_PUBLIC_REPORTS_FOR_DISPLAY - 2);

    await expect(getReportWithMessages(target.report.id)).resolves.toBeNull();

    await createPublicReports(context, 1);

    const result = await getReportWithMessages(target.report.id);

    expect(result?.report.bill_id).toBe(context.billId);
    expect(result?.messages).toHaveLength(1);
    expect(result?.bill.bill_content).toEqual({ title: "チャットログ議案" });
  });
});
