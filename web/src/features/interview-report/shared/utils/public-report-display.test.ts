import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import { describe, expect, it } from "vitest";
import {
  buildPublicReportsPage,
  buildStanceCounts,
  canViewReportWithMessages,
  countUserMessageCharacters,
  getBillIdFromPublicReportSession,
  mapPublicInterviewReports,
  type RawPublicInterviewReport,
  selectPrimaryBillContent,
} from "./public-report-display";

function rawReport(id: string): RawPublicInterviewReport {
  return {
    id,
    stance: "for",
    role: "general_citizen",
    role_title: "会社員",
    summary: `summary-${id}`,
    total_content_richness: 72,
    created_at: "2026-05-06T00:00:00.000Z",
  };
}

describe("public report display utilities", () => {
  it("公開レポートの表示用フィールドだけを写す", () => {
    expect(mapPublicInterviewReports([rawReport("report-1")])).toEqual([
      {
        id: "report-1",
        stance: "for",
        role: "general_citizen",
        role_title: "会社員",
        summary: "summary-report-1",
        total_content_richness: 72,
        created_at: "2026-05-06T00:00:00.000Z",
      },
    ]);
  });

  it("スタンス別件数を all に合算し、null stance は個別集計に入れない", () => {
    expect(
      buildStanceCounts([
        { stance: "for", count: 12 },
        { stance: "against", count: "5" },
        { stance: null, count: 3 },
      ])
    ).toEqual({
      all: 20,
      for: 12,
      against: 5,
      neutral: 0,
    });
  });

  it("ページサイズを超える公開レポートは hasMore を立てて切り詰める", () => {
    const result = buildPublicReportsPage(
      [rawReport("report-1"), rawReport("report-2")],
      1
    );

    expect(result).toEqual({
      reports: [rawReport("report-1")],
      hasMore: true,
    });
  });

  it("公開レポートのセッションから bill id を取り出す", () => {
    expect(
      getBillIdFromPublicReportSession({
        started_at: "2026-05-06T00:00:00.000Z",
        completed_at: null,
        interview_configs: { bill_id: "bill-1" },
      })
    ).toBe("bill-1");
    expect(
      getBillIdFromPublicReportSession({
        started_at: "2026-05-06T00:00:00.000Z",
        completed_at: null,
        interview_configs: null,
      })
    ).toBeNull();
  });

  it("bill_contents の配列・単体・null を表示用に正規化する", () => {
    expect(selectPrimaryBillContent([{ title: "議案タイトル" }])).toEqual({
      title: "議案タイトル",
    });
    expect(selectPrimaryBillContent({ title: "単体タイトル" })).toEqual({
      title: "単体タイトル",
    });
    expect(selectPrimaryBillContent(null)).toBeNull();
  });

  it("ユーザーメッセージだけの文字数を数える", () => {
    expect(
      countUserMessageCharacters([
        { role: "user", content: "abc" },
        { role: "assistant", content: "ignored" },
        { role: "user", content: "de" },
      ])
    ).toBe(5);
  });

  it("所有者は公開件数ゲートを迂回し、非所有者は公開フラグと件数を満たす必要がある", () => {
    expect(
      canViewReportWithMessages({
        isOwner: true,
        isPublicByAdmin: false,
        isPublicByUser: false,
        publicReportCount: 0,
      })
    ).toBe(true);
    expect(
      canViewReportWithMessages({
        isOwner: false,
        isPublicByAdmin: true,
        isPublicByUser: true,
        publicReportCount: MIN_PUBLIC_REPORTS_FOR_DISPLAY,
      })
    ).toBe(true);
    expect(
      canViewReportWithMessages({
        isOwner: false,
        isPublicByAdmin: true,
        isPublicByUser: true,
        publicReportCount: MIN_PUBLIC_REPORTS_FOR_DISPLAY - 1,
      })
    ).toBe(false);
  });
});
