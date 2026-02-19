import { describe, expect, it } from "vitest";
import {
  type BasicAuthConfig,
  isPageSpeedInsightsUA,
  parseBasicAuth,
  validateBasicAuthHeader,
} from "./basic-auth";

describe("parseBasicAuth", () => {
  it("should parse valid Basic auth header", () => {
    const encoded = btoa("user:pass");
    const result = parseBasicAuth(`Basic ${encoded}`);
    expect(result).toEqual({ username: "user", password: "pass" });
  });

  it("should return null for missing auth value", () => {
    expect(parseBasicAuth("Basic")).toBeNull();
  });

  it("should return null for empty string", () => {
    expect(parseBasicAuth("")).toBeNull();
  });
});

describe("isPageSpeedInsightsUA", () => {
  it("should return true for Chrome-Lighthouse UA", () => {
    expect(isPageSpeedInsightsUA("Mozilla/5.0 Chrome-Lighthouse")).toBe(true);
  });

  it("should return true for PageSpeed Insights UA", () => {
    expect(isPageSpeedInsightsUA("Mozilla/5.0 PageSpeed Insights")).toBe(true);
  });

  it("should return true for Google Page Speed Insights UA", () => {
    expect(isPageSpeedInsightsUA("Google Page Speed Insights")).toBe(true);
  });

  it("should return false for normal browser UA", () => {
    expect(
      isPageSpeedInsightsUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
    ).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isPageSpeedInsightsUA("")).toBe(false);
  });
});

describe("validateBasicAuthHeader", () => {
  const config: BasicAuthConfig = {
    username: "admin",
    password: "secret",
  };

  it("should return true for valid credentials", () => {
    const encoded = btoa("admin:secret");
    expect(validateBasicAuthHeader(`Basic ${encoded}`, config)).toBe(true);
  });

  it("should return false for wrong username", () => {
    const encoded = btoa("wrong:secret");
    expect(validateBasicAuthHeader(`Basic ${encoded}`, config)).toBe(false);
  });

  it("should return false for wrong password", () => {
    const encoded = btoa("admin:wrong");
    expect(validateBasicAuthHeader(`Basic ${encoded}`, config)).toBe(false);
  });

  it("should return false for null header", () => {
    expect(validateBasicAuthHeader(null, config)).toBe(false);
  });

  it("should return false for non-Basic scheme", () => {
    expect(validateBasicAuthHeader("Bearer token123", config)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(validateBasicAuthHeader("", config)).toBe(false);
  });
});
