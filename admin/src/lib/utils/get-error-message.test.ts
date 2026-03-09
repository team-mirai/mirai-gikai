import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
  it("Errorインスタンスからmessageを返す", () => {
    const error = new Error("something went wrong");
    expect(getErrorMessage(error, "fallback")).toBe("something went wrong");
  });

  it("Errorのサブクラスからmessageを返す", () => {
    const error = new TypeError("type error");
    expect(getErrorMessage(error, "fallback")).toBe("type error");
  });

  it("文字列が渡された場合はフォールバックを返す", () => {
    expect(getErrorMessage("string error", "fallback")).toBe("fallback");
  });

  it("nullが渡された場合はフォールバックを返す", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("undefinedが渡された場合はフォールバックを返す", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("数値が渡された場合はフォールバックを返す", () => {
    expect(getErrorMessage(42, "fallback")).toBe("fallback");
  });

  it("オブジェクトが渡された場合はフォールバックを返す", () => {
    expect(getErrorMessage({ message: "not an error" }, "fallback")).toBe(
      "fallback"
    );
  });

  it("空文字のmessageを持つErrorでも空文字を返す", () => {
    const error = new Error("");
    expect(getErrorMessage(error, "fallback")).toBe("");
  });
});
