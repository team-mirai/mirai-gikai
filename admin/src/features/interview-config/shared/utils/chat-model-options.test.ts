import { describe, expect, it } from "vitest";
import { CHAT_MODEL_OPTIONS, isValidChatModel } from "./chat-model-options";

describe("CHAT_MODEL_OPTIONS", () => {
  it("全てのオプションがprovider/model形式のvalueを持つ", () => {
    for (const option of CHAT_MODEL_OPTIONS) {
      expect(option.value).toMatch(/^(openai|google|anthropic)\//);
    }
  });

  it("全てのオプションがラベルを持つ", () => {
    for (const option of CHAT_MODEL_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("重複するvalueがない", () => {
    const values = CHAT_MODEL_OPTIONS.map((opt) => opt.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("isValidChatModel", () => {
  it("有効なモデルIDに対してtrueを返す", () => {
    expect(isValidChatModel("openai/gpt-4o-mini")).toBe(true);
    expect(isValidChatModel("google/gemini-3-flash")).toBe(true);
    expect(isValidChatModel("anthropic/claude-sonnet-4.6")).toBe(true);
  });

  it("無効なモデルIDに対してfalseを返す", () => {
    expect(isValidChatModel("invalid-model")).toBe(false);
    expect(isValidChatModel("openai/nonexistent")).toBe(false);
    expect(isValidChatModel("")).toBe(false);
  });
});
