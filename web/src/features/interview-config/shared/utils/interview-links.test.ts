import { describe, expect, it } from "vitest";

import {
  getBillDetailLink,
  getInterviewChatLink,
  getInterviewChatLogLink,
  getInterviewLPLink,
  getInterviewReportCompleteLink,
  getPublicReportLink,
} from "./interview-links";

describe("getBillDetailLink", () => {
  it("returns bill detail path without preview token", () => {
    expect(getBillDetailLink("bill-123")).toBe("/bills/bill-123");
  });

  it("returns preview path with token when provided", () => {
    expect(getBillDetailLink("bill-123", "tok-abc")).toBe(
      "/preview/bills/bill-123?token=tok-abc"
    );
  });
});

describe("getInterviewLPLink", () => {
  it("returns interview LP path without preview token", () => {
    expect(getInterviewLPLink("bill-123")).toBe("/bills/bill-123/interview");
  });

  it("returns preview interview LP path with token", () => {
    expect(getInterviewLPLink("bill-123", "tok-abc")).toBe(
      "/preview/bills/bill-123/interview?token=tok-abc"
    );
  });
});

describe("getInterviewChatLink", () => {
  it("returns interview chat path without preview token", () => {
    expect(getInterviewChatLink("bill-123")).toBe(
      "/bills/bill-123/interview/chat"
    );
  });

  it("returns preview interview chat path with token", () => {
    expect(getInterviewChatLink("bill-123", "tok-abc")).toBe(
      "/preview/bills/bill-123/interview/chat?token=tok-abc"
    );
  });
});

describe("getInterviewReportCompleteLink", () => {
  it("returns report complete path", () => {
    expect(getInterviewReportCompleteLink("report-456")).toBe(
      "/report/report-456/complete"
    );
  });
});

describe("getPublicReportLink", () => {
  it("returns public report path", () => {
    expect(getPublicReportLink("report-456")).toBe("/report/report-456");
  });
});

describe("getInterviewChatLogLink", () => {
  it("returns chat log path", () => {
    expect(getInterviewChatLogLink("report-456")).toBe(
      "/report/report-456/chat-log"
    );
  });
});
