import { describe, expect, it } from "vitest";
import { generateDefaultConfigName } from "./default-config-name";

describe("generateDefaultConfigName", () => {
  it("日付を YYYY/MM/DD 作成 形式で返す", () => {
    const date = new Date("2026-02-19T10:00:00+09:00");
    expect(generateDefaultConfigName(date)).toBe("2026/02/19 作成");
  });

  it("UTCの日付がJSTで翌日になるケースを正しく扱う", () => {
    // UTC 23:00 = JST 翌日 08:00
    const date = new Date("2026-03-31T23:00:00Z");
    expect(generateDefaultConfigName(date)).toBe("2026/04/01 作成");
  });

  it("引数なしで現在日付を使用する", () => {
    const result = generateDefaultConfigName();
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2} 作成$/);
  });
});
