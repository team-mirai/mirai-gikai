import { describe, expect, it } from "vitest";
import { getModeLabel } from "./get-mode-label";

describe("getModeLabel", () => {
  it("loopをループと表示する", () => {
    expect(getModeLabel("loop")).toBe("ループ");
  });

  it("bulkを一括と表示する", () => {
    expect(getModeLabel("bulk")).toBe("一括");
  });
});
