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
});
