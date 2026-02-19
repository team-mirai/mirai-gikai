import { describe, expect, it } from "vitest";
import {
  type BasicAuthConfig,
  isPageSpeedInsightsUA,
  parseBasicAuth,
  validateBasicAuthHeader,
} from "./basic-auth";

describe("parseBasicAuth", () => {
  it("parses a valid Basic auth header", () => {
    const result = parseBasicAuth("Basic YWRtaW46cGFzc3dvcmQxMjM=");
    expect(result).toEqual({ username: "admin", password: "password123" });
  });

  it("parses credentials with colon in password", () => {
    const result = parseBasicAuth("Basic dXNlcjpwYXNzOndvcmQ=");
    expect(result).toEqual({ username: "user", password: "pass" });
  });

  it("returns null when auth value after 'Basic ' is missing", () => {
    expect(parseBasicAuth("Basic ")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseBasicAuth("")).toBeNull();
  });

  it("returns a result for non-Basic scheme with decodable value", () => {
    const result = parseBasicAuth("Bearer token123");
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("username");
  });

  it("returns null when header has only one segment with no space", () => {
    expect(parseBasicAuth("NoSpaceHere")).toBeNull();
  });

  it("returns undefined password when decoded value has no colon", () => {
    const result = parseBasicAuth("Basic bm9jb2xvbg==");
    expect(result).toEqual({ username: "nocolon", password: undefined });
  });

  it("returns null for invalid base64 input", () => {
    expect(parseBasicAuth("Basic !!!invalid-base64!!!")).toBeNull();
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
