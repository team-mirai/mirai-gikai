import { describe, expect, it } from "vitest";
import { buildReportsByUserId } from "./build-reports-by-user-id";

describe("buildReportsByUserId", () => {
  it("セッションがない場合は空のMapを返す", () => {
    const result = buildReportsByUserId([]);
    expect(result.size).toBe(0);
  });

  it("レポートがないセッションはスキップする", () => {
    const result = buildReportsByUserId([
      {
        id: "session-1",
        user_id: "user-1",
        interview_report: null,
        interview_configs: {
          id: "config-1",
          bill_id: "bill-1",
          bills: { id: "bill-1", name: "議案A" },
        },
      },
    ]);
    expect(result.size).toBe(0);
  });

  it("billsがnullのセッションはスキップする", () => {
    const result = buildReportsByUserId([
      {
        id: "session-1",
        user_id: "user-1",
        interview_report: { id: "report-1", stance: "for" },
        interview_configs: { id: "config-1", bill_id: "bill-1", bills: null },
      },
    ]);
    expect(result.size).toBe(0);
  });

  it("有効なセッションからレポート情報を構築する", () => {
    const result = buildReportsByUserId([
      {
        id: "session-1",
        user_id: "user-1",
        interview_report: { id: "report-1", stance: "for" },
        interview_configs: {
          id: "config-1",
          bill_id: "bill-1",
          bills: { id: "bill-1", name: "議案A" },
        },
      },
    ]);

    expect(result.size).toBe(1);
    const reports = result.get("user-1");
    expect(reports).toEqual([
      {
        sessionId: "session-1",
        billId: "bill-1",
        configId: "config-1",
        billName: "議案A",
        stance: "for",
      },
    ]);
  });

  it("同一ユーザーの複数レポートをグループ化する", () => {
    const result = buildReportsByUserId([
      {
        id: "session-1",
        user_id: "user-1",
        interview_report: { id: "report-1", stance: "for" },
        interview_configs: {
          id: "config-1",
          bill_id: "bill-1",
          bills: { id: "bill-1", name: "議案A" },
        },
      },
      {
        id: "session-2",
        user_id: "user-1",
        interview_report: { id: "report-2", stance: "against" },
        interview_configs: {
          id: "config-2",
          bill_id: "bill-2",
          bills: { id: "bill-2", name: "議案B" },
        },
      },
    ]);

    expect(result.size).toBe(1);
    const reports = result.get("user-1");
    expect(reports).toHaveLength(2);
    expect(reports?.[0].billName).toBe("議案A");
    expect(reports?.[1].billName).toBe("議案B");
  });

  it("異なるユーザーのレポートを分離する", () => {
    const result = buildReportsByUserId([
      {
        id: "session-1",
        user_id: "user-1",
        interview_report: { id: "report-1", stance: "neutral" },
        interview_configs: {
          id: "config-1",
          bill_id: "bill-1",
          bills: { id: "bill-1", name: "議案A" },
        },
      },
      {
        id: "session-2",
        user_id: "user-2",
        interview_report: { id: "report-2", stance: "for" },
        interview_configs: {
          id: "config-1",
          bill_id: "bill-1",
          bills: { id: "bill-1", name: "議案A" },
        },
      },
    ]);

    expect(result.size).toBe(2);
    expect(result.get("user-1")).toHaveLength(1);
    expect(result.get("user-2")).toHaveLength(1);
  });

  it("stanceがnullのレポートも含める", () => {
    const result = buildReportsByUserId([
      {
        id: "session-1",
        user_id: "user-1",
        interview_report: { id: "report-1", stance: null },
        interview_configs: {
          id: "config-1",
          bill_id: "bill-1",
          bills: { id: "bill-1", name: "議案A" },
        },
      },
    ]);

    const reports = result.get("user-1");
    expect(reports?.[0].stance).toBeNull();
  });
});
