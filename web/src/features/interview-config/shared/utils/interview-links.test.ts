import { describe, expect, it } from "vitest";

import {
  getBillDetailLink,
  getInterviewChatLink,
  getInterviewChatLogLink,
  getInterviewDisclosureLink,
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

  it("preserves previewConfigId in the preview URL", () => {
    expect(getInterviewLPLink("bill-123", "tok-abc", "config-9")).toBe(
      "/preview/bills/bill-123/interview?token=tok-abc&configId=config-9"
    );
  });

  it("ignores previewConfigId when no preview token is given", () => {
    expect(getInterviewLPLink("bill-123", undefined, "config-9")).toBe(
      "/bills/bill-123/interview"
    );
  });
});

describe("getInterviewDisclosureLink", () => {
  it("returns disclosure path without preview token", () => {
    expect(getInterviewDisclosureLink("bill-123")).toBe(
      "/bills/bill-123/interview/disclosure"
    );
  });

  it("returns preview disclosure path with token + configId", () => {
    expect(getInterviewDisclosureLink("bill-123", "tok-abc", "config-9")).toBe(
      "/preview/bills/bill-123/interview/disclosure?token=tok-abc&configId=config-9"
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

  it("preserves previewConfigId in the preview URL", () => {
    expect(getInterviewChatLink("bill-123", "tok-abc", "config-9")).toBe(
      "/preview/bills/bill-123/interview/chat?token=tok-abc&configId=config-9"
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

  it("returns public report path with from=opinions when from is specified", () => {
    expect(getPublicReportLink("report-456", "opinions")).toBe(
      "/report/report-456?from=opinions"
    );
  });
});

describe("getInterviewChatLogLink", () => {
  it("returns chat log path", () => {
    expect(getInterviewChatLogLink("report-456")).toBe(
      "/report/report-456/chat-log"
    );
  });

  it("returns chat log path with from=complete when from is specified", () => {
    expect(getInterviewChatLogLink("report-456", "complete")).toBe(
      "/report/report-456/chat-log?from=complete"
    );
  });
});
