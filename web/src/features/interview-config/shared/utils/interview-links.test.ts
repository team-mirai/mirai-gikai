import { describe, expect, it } from "vitest";

import {
  getBillDetailLink,
  getInterviewChatLink,
  getInterviewChatLogLink,
  getInterviewLPLink,
  getInterviewMessageLink,
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

  it("returns public report path with from=opinions when from is specified", () => {
    expect(getPublicReportLink("report-456", "opinions")).toBe(
      "/report/report-456?from=opinions"
    );
  });
});

describe("getInterviewChatLogLink", () => {
  it("returns public report chat-log section because chat log is integrated there", () => {
    expect(getInterviewChatLogLink("report-456")).toBe(
      "/report/report-456#chat-log"
    );
  });

  it("returns public report chat-log section with from=opinions when from is specified", () => {
    expect(getInterviewChatLogLink("report-456", "opinions")).toBe(
      "/report/report-456?from=opinions#chat-log"
    );
  });

  it("returns report complete chat-log section when from=complete is specified", () => {
    expect(getInterviewChatLogLink("report-456", "complete")).toBe(
      "/report/report-456/complete#chat-log"
    );
  });
});

describe("getInterviewMessageLink", () => {
  it("returns public report message anchor", () => {
    expect(getInterviewMessageLink("report-456", "abc-123")).toBe(
      "/report/report-456#message-abc-123"
    );
  });

  it("returns public report message anchor with from=opinions when from is specified", () => {
    expect(getInterviewMessageLink("report-456", "abc-123", "opinions")).toBe(
      "/report/report-456?from=opinions#message-abc-123"
    );
  });

  it("returns report complete message anchor when from=complete is specified", () => {
    expect(getInterviewMessageLink("report-456", "abc-123", "complete")).toBe(
      "/report/report-456/complete#message-abc-123"
    );
  });

  it("appends encoded quote as query before the hash", () => {
    expect(
      getInterviewMessageLink(
        "report-456",
        "abc-123",
        undefined,
        "戻ったら違う部署"
      )
    ).toBe(
      `/report/report-456?quote=${encodeURIComponent("戻ったら違う部署")}#message-abc-123`
    );
  });

  it("uses & separator when from query already present", () => {
    expect(
      getInterviewMessageLink("report-456", "abc-123", "opinions", "引用")
    ).toBe(
      `/report/report-456?from=opinions&quote=${encodeURIComponent("引用")}#message-abc-123`
    );
  });
});
