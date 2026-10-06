import { describe, expect, it } from "vitest";
import { formatSessionPeriod } from "./format-session-period";

describe("formatSessionPeriod", () => {
  it("同じ年の会期は終了日の年を省く", () => {
    expect(formatSessionPeriod("2025-10-24", "2025-12-17")).toBe(
      "2025.10.24〜12.17"
    );
  });

  it("年をまたぐ会期は終了日にも年を付ける", () => {
    expect(formatSessionPeriod("2025-12-24", "2026-06-21")).toBe(
      "2025.12.24〜2026.06.21"
    );
  });
});
