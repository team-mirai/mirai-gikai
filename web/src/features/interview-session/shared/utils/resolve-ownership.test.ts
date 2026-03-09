import { describe, expect, it } from "vitest";
import { resolveOwnership } from "./resolve-ownership";

describe("resolveOwnership", () => {
  it("認証失敗の場合はauthorized: falseとエラーメッセージを返す", () => {
    const authResult = {
      authenticated: false as const,
      error: "認証が必要です",
    };

    const result = resolveOwnership(authResult, null);

    expect(result).toEqual({
      authorized: false,
      error: "認証が必要です",
    });
  });

  it("セッションがnullの場合はセッションが見つからないエラーを返す", () => {
    const authResult = {
      authenticated: true as const,
      userId: "user-123",
    };

    const result = resolveOwnership(authResult, null);

    expect(result).toEqual({
      authorized: false,
      error: "セッションが見つかりません",
    });
  });

  it("所有者が不一致の場合はアクセス権限エラーを返す", () => {
    const authResult = {
      authenticated: true as const,
      userId: "user-123",
    };
    const session = { user_id: "user-456" };

    const result = resolveOwnership(authResult, session);

    expect(result).toEqual({
      authorized: false,
      error: "このセッションへのアクセス権限がありません",
    });
  });

  it("所有者が一致する場合はauthorized: trueとuserIdを返す", () => {
    const authResult = {
      authenticated: true as const,
      userId: "user-123",
    };
    const session = { user_id: "user-123" };

    const result = resolveOwnership(authResult, session);

    expect(result).toEqual({
      authorized: true,
      userId: "user-123",
    });
  });
});
