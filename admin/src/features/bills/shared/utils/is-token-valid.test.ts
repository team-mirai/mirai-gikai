import { describe, expect, it } from "vitest";
import { isTokenValid } from "./is-token-valid";

describe("isTokenValid", () => {
  it("有効期限が現在時刻より後ならtrueを返す", () => {
    const now = new Date("2025-01-15T00:00:00Z");
    const expiresAt = "2025-02-01T00:00:00Z";
    expect(isTokenValid(expiresAt, now)).toBe(true);
  });

  it("有効期限が現在時刻より前ならfalseを返す", () => {
    const now = new Date("2025-02-15T00:00:00Z");
    const expiresAt = "2025-02-01T00:00:00Z";
    expect(isTokenValid(expiresAt, now)).toBe(false);
  });

  it("有効期限がちょうど現在時刻ならfalseを返す", () => {
    const now = new Date("2025-02-01T00:00:00Z");
    const expiresAt = "2025-02-01T00:00:00Z";
    expect(isTokenValid(expiresAt, now)).toBe(false);
  });
});
