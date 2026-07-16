import { describe, expect, it } from "vitest";
import { toAlphaLocalId } from "./alpha-local-id";

describe("toAlphaLocalId", () => {
  it("列表記の境界値を英字に変換する", () => {
    expect(toAlphaLocalId("t", 0)).toBe("tA");
    expect(toAlphaLocalId("t", 1)).toBe("tB");
    expect(toAlphaLocalId("t", 25)).toBe("tZ");
    expect(toAlphaLocalId("t", 26)).toBe("tAA");
    expect(toAlphaLocalId("t", 27)).toBe("tAB");
    expect(toAlphaLocalId("t", 51)).toBe("tAZ");
    expect(toAlphaLocalId("t", 52)).toBe("tBA");
    expect(toAlphaLocalId("t", 701)).toBe("tZZ");
    expect(toAlphaLocalId("t", 702)).toBe("tAAA");
  });

  it("prefix を結合する", () => {
    expect(toAlphaLocalId("e", 0)).toBe("eA");
    expect(toAlphaLocalId("e", 26)).toBe("eAA");
    expect(toAlphaLocalId("n", 0)).toBe("nA");
  });
});
