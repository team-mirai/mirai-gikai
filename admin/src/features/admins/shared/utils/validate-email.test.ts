import { describe, expect, it } from "vitest";
import { validateEmail } from "./validate-email";

describe("validateEmail", () => {
  it("正しいメールアドレスの場合、nullを返す", () => {
    expect(validateEmail("admin@example.com")).toBeNull();
  });

  it("サブドメインを含むメールアドレスの場合、nullを返す", () => {
    expect(validateEmail("user@mail.example.co.jp")).toBeNull();
  });

  it("プラス記号を含むメールアドレスの場合、nullを返す", () => {
    expect(validateEmail("user+tag@example.com")).toBeNull();
  });

  it("@がない場合、エラーメッセージを返す", () => {
    expect(validateEmail("invalid-email")).toBe(
      "有効なメールアドレスを入力してください"
    );
  });

  it("ドメインがない場合、エラーメッセージを返す", () => {
    expect(validateEmail("user@")).toBe(
      "有効なメールアドレスを入力してください"
    );
  });

  it("ユーザー名がない場合、エラーメッセージを返す", () => {
    expect(validateEmail("@example.com")).toBe(
      "有効なメールアドレスを入力してください"
    );
  });

  it("空文字列の場合、エラーメッセージを返す", () => {
    expect(validateEmail("")).toBe("有効なメールアドレスを入力してください");
  });

  it("スペースを含む場合、エラーメッセージを返す", () => {
    expect(validateEmail("user @example.com")).toBe(
      "有効なメールアドレスを入力してください"
    );
  });
});
