import { describe, expect, it } from "vitest";
import { normalizeInterviewReport } from "./normalize-interview-report";

describe("normalizeInterviewReport", () => {
  it("オブジェクトはそのまま返す", () => {
    const report = { id: "r1" };
    expect(normalizeInterviewReport(report)).toBe(report);
  });

  it("配列の場合は最初の要素を返す", () => {
    const first = { id: "r1" };
    expect(normalizeInterviewReport([first, { id: "r2" }])).toBe(first);
  });

  it("空配列の場合は null を返す", () => {
    expect(normalizeInterviewReport([])).toBeNull();
  });

  it("null の場合は null を返す", () => {
    expect(normalizeInterviewReport(null)).toBeNull();
  });
});
