import { describe, expect, it } from "vitest";
import { extractGatewayCost } from "./extract-gateway-cost";

describe("extractGatewayCost", () => {
  it("単一ステップのコストを返す", () => {
    expect(
      extractGatewayCost([{ providerMetadata: { gateway: { cost: "0.01" } } }])
    ).toBe(0.01);
  });

  it("複数ステップのコストを合算する", () => {
    expect(
      extractGatewayCost([
        { providerMetadata: { gateway: { cost: 0.01 } } },
        { providerMetadata: { gateway: { cost: 0.02 } } },
      ])
    ).toBeCloseTo(0.03);
  });

  it("コストが取得できないステップは無視する", () => {
    expect(
      extractGatewayCost([
        { providerMetadata: undefined },
        { providerMetadata: { gateway: { cost: 0.02 } } },
      ])
    ).toBe(0.02);
  });

  it("どのステップからも取得できない場合は undefined を返す", () => {
    expect(
      extractGatewayCost([
        { providerMetadata: undefined },
        { providerMetadata: { openai: {} } },
        { providerMetadata: { gateway: { cost: "invalid" } } },
      ])
    ).toBeUndefined();
  });

  it("ステップが無い場合は undefined を返す", () => {
    expect(extractGatewayCost([])).toBeUndefined();
  });
});
