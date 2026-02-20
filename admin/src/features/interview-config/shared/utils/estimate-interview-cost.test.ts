import { describe, expect, it } from "vitest";
import {
  estimateInterviewCostUsd,
  formatEstimatedCost,
} from "./estimate-interview-cost";

describe("estimateInterviewCostUsd", () => {
  it("GPT-4o miniの推定コストを正しく算出する", () => {
    // input: 0.15 * 50000 / 1M = 0.0075
    // output: 0.6 * 10000 / 1M = 0.006
    // total: 0.0135
    const cost = estimateInterviewCostUsd("openai/gpt-4o-mini");
    expect(cost).toBeCloseTo(0.0135, 4);
  });

  it("Claude Opus 4.6の推定コストを正しく算出する", () => {
    // input: 5 * 50000 / 1M = 0.25
    // output: 25 * 10000 / 1M = 0.25
    // total: 0.50
    const cost = estimateInterviewCostUsd("anthropic/claude-opus-4.6");
    expect(cost).toBeCloseTo(0.5, 4);
  });

  it("Gemini 3 Flashの推定コストを正しく算出する", () => {
    // input: 0.5 * 50000 / 1M = 0.025
    // output: 3 * 10000 / 1M = 0.03
    // total: 0.055
    const cost = estimateInterviewCostUsd("google/gemini-3-flash");
    expect(cost).toBeCloseTo(0.055, 4);
  });

  it("不明なモデルに対してnullを返す", () => {
    expect(estimateInterviewCostUsd("unknown/model")).toBeNull();
  });
});

describe("formatEstimatedCost", () => {
  it("$0.01未満のコストを~$0.01と表示する", () => {
    expect(formatEstimatedCost(0.005)).toBe("~$0.01");
  });

  it("$0.01以上のコストを小数第2位まで表示する", () => {
    expect(formatEstimatedCost(0.0135)).toBe("~$0.01");
    expect(formatEstimatedCost(0.225)).toBe("~$0.23");
    expect(formatEstimatedCost(0.5)).toBe("~$0.50");
  });
});
