import { describe, expect, it } from "vitest";
import {
  CHAT_MODEL_OPTIONS,
  CHAT_MODEL_GROUPS,
  isValidChatModel,
} from "./chat-model-options";

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

describe("CHAT_MODEL_GROUPS", () => {
  it("3つのプロバイダーグループが存在する", () => {
    expect(CHAT_MODEL_GROUPS).toHaveLength(3);
    expect(CHAT_MODEL_GROUPS.map((g) => g.provider)).toEqual([
      "OpenAI",
      "Google",
      "Anthropic",
    ]);
  });

  it("全グループのモデル数がフラット一覧と一致する", () => {
    const groupTotal = CHAT_MODEL_GROUPS.reduce(
      (sum, g) => sum + g.options.length,
      0
    );
    expect(groupTotal).toBe(CHAT_MODEL_OPTIONS.length);
  });

  it("全モデルに推定コストが設定されている", () => {
    for (const group of CHAT_MODEL_GROUPS) {
      for (const option of group.options) {
        expect(option.estimatedCost).not.toBeNull();
        expect(option.estimatedCost).toMatch(/^~\$/);
      }
    }
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
