import { describe, expect, it } from "vitest";
import { buildOriginUrl } from "./url";

describe("buildOriginUrl", () => {
  it("should build URL from host and proto", () => {
    expect(buildOriginUrl("example.com", "https")).toBe("https://example.com");
  });

  it("should use http proto when specified", () => {
    expect(buildOriginUrl("localhost:3000", "http")).toBe(
      "http://localhost:3000"
    );
  });

  it("should default proto to https when null", () => {
    expect(buildOriginUrl("example.com", null)).toBe("https://example.com");
  });

  it("should handle null host", () => {
    expect(buildOriginUrl(null, "https")).toBe("https://null");
  });
});
