import { describe, expect, it } from "vitest";
import {
  jstDateTimeLocalToIso,
  resolvePublishAt,
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

describe("resolvePublishAt", () => {
  const saved = "2026-10-01T12:00:59+09:00";

  it("入力が保存済みの値から変わっていなければ保存済みの値（秒を含む）を返す", () => {
    expect(resolvePublishAt("2026-10-01T12:00", saved)).toBe(saved);
  });

  it("入力が変更されていれば入力値から ISO 日時を生成する", () => {
    expect(resolvePublishAt("2026-10-02T09:30", saved)).toBe(
      "2026-10-02T09:30:00+09:00"
    );
  });

  it("入力をクリアすると null（即時公開）を返す", () => {
    expect(resolvePublishAt("", saved)).toBeNull();
  });

  it("未設定のまま空欄なら null を返す", () => {
    expect(resolvePublishAt("", null)).toBeNull();
  });
});
