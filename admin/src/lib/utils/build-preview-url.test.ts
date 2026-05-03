import { describe, expect, it } from "vitest";
import { buildPreviewUrl } from "./build-preview-url";

describe("buildPreviewUrl", () => {
  it("議案プレビューURLを構築する", () => {
    const url = buildPreviewUrl(
      "http://localhost:3000",
      "/preview/bills/bill-123",
      "abc-token"
    );
    expect(url).toBe(
      "http://localhost:3000/preview/bills/bill-123?token=abc-token"
    );
  });

  it("インタビュープレビューURLを構築する", () => {
    const url = buildPreviewUrl(
      "http://localhost:3000",
      "/preview/bills/bill-123/interview",
      "abc-token"
    );
    expect(url).toBe(
      "http://localhost:3000/preview/bills/bill-123/interview?token=abc-token"
    );
  });

  it("本番URLでも正しく構築する", () => {
    const url = buildPreviewUrl(
      "https://example.com",
      "/preview/bills/bill-456",
      "prod-token"
    );
    expect(url).toBe(
      "https://example.com/preview/bills/bill-456?token=prod-token"
    );
  });

  it("追加のクエリパラメータを付与できる", () => {
    const url = buildPreviewUrl(
      "http://localhost:3000",
      "/preview/bills/bill-123/interview",
      "abc-token",
      { configId: "config-456" }
    );
    expect(url).toBe(
      "http://localhost:3000/preview/bills/bill-123/interview?token=abc-token&configId=config-456"
    );
  });

  it("値が空のクエリパラメータはスキップする", () => {
    const url = buildPreviewUrl(
      "http://localhost:3000",
      "/preview/bills/bill-123/interview",
      "abc-token",
      { configId: undefined, other: "" }
    );
    expect(url).toBe(
      "http://localhost:3000/preview/bills/bill-123/interview?token=abc-token"
    );
  });
});
