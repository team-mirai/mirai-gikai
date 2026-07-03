import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { determineModerationStatus } from "@mirai-gikai/shared/moderation/status";
import { generateText } from "ai"; // ← generateObject から generateText に変更
import { beforeEach, describe, expect, it, vi } from "vitest";
import { evaluateModerationScore } from "./evaluate-moderation-score"; // パスは適宜調整してください

vi.mock("server-only", () => ({}));

// 1. ai ライブラリのモックを generateText と Output に修正
vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn(),
  },
}));

vi.mock("@mirai-gikai/shared/moderation/status", () => ({
  determineModerationStatus: vi.fn(),
}));

describe("evaluateModerationScore", () => {
  const mockInput = {
    summary: "テストサマリー",
    opinions: [{ title: "意見タイトル", content: "意見内容" }],
    roleDescription: "ロール説明",
    messages: [{ role: "user", content: "こんにちは" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常にモデレーションスコアを評価し、正しい構造のデータを返すこと", async () => {
    // 2. generateText の戻り値を { object } ではなく { output } に変更
    vi.mocked(generateText).mockResolvedValue({
      output: { score: 0.85, reasoning: "内容に問題はありません。" },
    } as any);

    vi.mocked(determineModerationStatus).mockReturnValue("safe" as any);

    const result = await evaluateModerationScore(mockInput);

    expect(result).toEqual({
      score: 0.85,
      status: "safe",
      reasoning: "内容に問題はありません。",
    });

    // 3. 検証先を generateText に変更
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: DEFAULT_INTERVIEW_CHAT_MODEL,
      })
    );
  });

  it("deps でカスタムモデルが渡された場合、デフォルトモデルではなくそのモデルが使用されること", async () => {
    // 4. こちらも generateText と output に変更
    vi.mocked(generateText).mockResolvedValue({
      output: { score: 0.2, reasoning: "不適切な表現が含まれます。" },
    } as any);
    vi.mocked(determineModerationStatus).mockReturnValue("flagged" as any);

    const mockCustomModel = { modelId: "custom-mock-model" } as any;

    const result = await evaluateModerationScore(mockInput, {
      model: mockCustomModel,
    });

    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: mockCustomModel,
      })
    );
    expect(result.status).toBe("flagged");
  });
});
