import { describe, expect, it } from "vitest";
import { formatCitationLabel } from "./citation-utils";

describe("formatCitationLabel", () => {
  it("returns 'unknown' for empty sources", () => {
    expect(formatCitationLabel([])).toBe("unknown");
  });

  it("returns hostname for a single source", () => {
    expect(formatCitationLabel(["https://example.com/page"])).toBe(
      "example.com"
    );
  });

  it("returns hostname +N for multiple sources", () => {
    expect(
      formatCitationLabel([
        "https://example.com/page",
        "https://other.com/page",
      ])
    ).toBe("example.com +1");
  });

  it("returns hostname +N for three sources", () => {
    expect(
      formatCitationLabel([
        "https://example.com/a",
        "https://other.com/b",
        "https://third.org/c",
      ])
    ).toBe("example.com +2");
  });

  it("handles URLs with subdomains", () => {
    expect(formatCitationLabel(["https://www.example.com/page"])).toBe(
      "www.example.com"
    );
  });

  it("handles URLs with ports (hostname excludes port)", () => {
    expect(formatCitationLabel(["https://example.com:8080/page"])).toBe(
      "example.com"
    );
  });
});
