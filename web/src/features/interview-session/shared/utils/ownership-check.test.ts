import { describe, expect, it } from "vitest";
import { isSessionOwner } from "./ownership-check";

describe("isSessionOwner", () => {
  it("同じユーザーIDならtrueを返す", () => {
    expect(isSessionOwner("user-123", "user-123")).toBe(true);
  });

  it("異なるユーザーIDならfalseを返す", () => {
    expect(isSessionOwner("user-123", "user-456")).toBe(false);
  });

  it("空文字同士ならtrueを返す", () => {
    expect(isSessionOwner("", "")).toBe(true);
  });

  it("片方が空文字ならfalseを返す", () => {
    expect(isSessionOwner("user-123", "")).toBe(false);
    expect(isSessionOwner("", "user-123")).toBe(false);
  });
});
