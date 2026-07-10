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

  it("GPT-5.6 Solの推定コストを正しく算出する", () => {
    // input: 5 * 85000 / 1M = 0.425
    // output: 30 * 3000 / 1M = 0.09
    // total: 0.515
    const cost = estimateInterviewCostUsd("openai/gpt-5.6-sol");
    expect(cost).toBeCloseTo(0.515, 4);
  });

  it("GPT-5.6 Terraの推定コストを正しく算出する", () => {
    // input: 2.5 * 85000 / 1M = 0.2125
    // output: 15 * 3000 / 1M = 0.045
    // total: 0.2575
    const cost = estimateInterviewCostUsd("openai/gpt-5.6-terra");
    expect(cost).toBeCloseTo(0.2575, 4);
  });

  it("GPT-5.6 Lunaの推定コストを正しく算出する", () => {
    // input: 1 * 85000 / 1M = 0.085
    // output: 6 * 3000 / 1M = 0.018
    // total: 0.103
    const cost = estimateInterviewCostUsd("openai/gpt-5.6-luna");
    expect(cost).toBeCloseTo(0.103, 4);
  });

  it("Claude Sonnet 5の推定コストを正しく算出する", () => {
    // input: 3 * 85000 / 1M = 0.255
    // output: 15 * 3000 / 1M = 0.045
    // total: 0.30
    const cost = estimateInterviewCostUsd("anthropic/claude-sonnet-5");
    expect(cost).toBeCloseTo(0.3, 4);
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
