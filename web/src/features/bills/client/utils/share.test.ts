import { describe, expect, it } from "vitest";

import type { BillWithContent } from "../../shared/types";
import { createBillShareUrl, createShareMessage } from "./share";

describe("createBillShareUrl", () => {
  it("generates URL with origin, billId, and difficulty", () => {
    const url = createBillShareUrl("https://example.com", "bill-123", "normal");
    expect(url).toBe("https://example.com/bills/bill-123?difficulty=normal");
  });

  it("generates URL with hard difficulty", () => {
    const url = createBillShareUrl("https://example.com", "bill-456", "hard");
    expect(url).toBe("https://example.com/bills/bill-456?difficulty=hard");
  });

  it("handles origin without trailing slash", () => {
    const url = createBillShareUrl("http://localhost:3000", "abc", "normal");
    expect(url).toBe("http://localhost:3000/bills/abc?difficulty=normal");
  });
});

describe("createShareMessage", () => {
  const baseBill = {
    id: "bill-1",
    name: "正式法案名称",
    tags: [],
  } as unknown as BillWithContent;

  it("uses bill_content.title when available", () => {
    const bill: BillWithContent = {
      ...baseBill,
      bill_content: {
        title: "わかりやすいタイトル",
      } as BillWithContent["bill_content"],
    };
    expect(createShareMessage(bill)).toBe("わかりやすいタイトル #みらい議会");
  });

  it("falls back to bill.name when bill_content is undefined", () => {
    const bill: BillWithContent = {
      ...baseBill,
      bill_content: undefined,
    };
    expect(createShareMessage(bill)).toBe("正式法案名称 #みらい議会");
  });

  it("falls back to bill.name when bill_content.title is null", () => {
    const bill: BillWithContent = {
      ...baseBill,
      bill_content: { title: null } as BillWithContent["bill_content"],
    };
    expect(createShareMessage(bill)).toBe("正式法案名称 #みらい議会");
  });

  it("includes hashtag #みらい議会", () => {
    const message = createShareMessage(baseBill);
    expect(message).toContain("#みらい議会");
  });
});
