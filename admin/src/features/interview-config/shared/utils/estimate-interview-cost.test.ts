import { describe, expect, it } from "vitest";
import {
  estimateInterviewCostUsd,
  formatEstimatedCost,
} from "./estimate-interview-cost";

describe("estimateInterviewCostUsd", () => {
  it("GPT-4o miniの推定コストを正しく算出する", () => {
    // input: 0.15 * 85000 / 1M = 0.01275
    // output: 0.6 * 3000 / 1M = 0.0018
    // total: 0.01455
    const cost = estimateInterviewCostUsd("openai/gpt-4o-mini");
    expect(cost).toBeCloseTo(0.01455, 4);
  });

  it("Claude Opus 4.6の推定コストを正しく算出する", () => {
    // input: 5 * 85000 / 1M = 0.425
    // output: 25 * 3000 / 1M = 0.075
    // total: 0.50
    const cost = estimateInterviewCostUsd("anthropic/claude-opus-4.6");
    expect(cost).toBeCloseTo(0.5, 4);
  });

  it("Gemini 3 Flashの推定コストを正しく算出する", () => {
    // input: 0.5 * 85000 / 1M = 0.0425
    // output: 3 * 3000 / 1M = 0.009
    // total: 0.0515
    const cost = estimateInterviewCostUsd("google/gemini-3-flash");
    expect(cost).toBeCloseTo(0.0515, 4);
  });

  it("不明なモデルに対してnullを返す", () => {
    expect(estimateInterviewCostUsd("unknown/model")).toBeNull();
  });
});

describe("formatEstimatedCost", () => {
  it("1円未満のコストを~1円と表示する", () => {
    // $0.005 * 150 = 0.75円 → ~1円
    expect(formatEstimatedCost(0.005)).toBe("~1円");
  });

  it("コストを四捨五入して円表示する", () => {
    // $0.01455 * 150 = 2.18円 → ~2円
    expect(formatEstimatedCost(0.01455)).toBe("~2円");
    // $0.225 * 150 = 33.75円 → ~34円
    expect(formatEstimatedCost(0.225)).toBe("~34円");
    // $0.5 * 150 = 75円 → ~75円
    expect(formatEstimatedCost(0.5)).toBe("~75円");
  });
});
