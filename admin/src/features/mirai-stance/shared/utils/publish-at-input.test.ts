import { describe, expect, it } from "vitest";
import {
  jstDateTimeLocalToIso,
  toJstDateTimeLocalValue,
} from "./publish-at-input";

describe("toJstDateTimeLocalValue", () => {
  it("UTC の日時を日本時間の datetime-local 値に変換する", () => {
    expect(toJstDateTimeLocalValue("2026-09-30T15:30:00+00:00")).toBe(
      "2026-10-01T00:30"
    );
  });

  it("null は空文字を返す", () => {
    expect(toJstDateTimeLocalValue(null)).toBe("");
  });
});

describe("jstDateTimeLocalToIso", () => {
  it("datetime-local 値を日本時間の ISO 日時に変換する", () => {
    expect(jstDateTimeLocalToIso("2026-10-01T00:30")).toBe(
      "2026-10-01T00:30:00+09:00"
    );
  });

  it("空文字は null（即時公開）を返す", () => {
    expect(jstDateTimeLocalToIso("")).toBeNull();
  });

  it("toJstDateTimeLocalValue と往復して同じ時刻になる", () => {
    const iso = "2026-12-24T09:15:00.000Z";
    const roundTripped = jstDateTimeLocalToIso(toJstDateTimeLocalValue(iso));
    expect(new Date(roundTripped ?? "").toISOString()).toBe(iso);
  });
});
