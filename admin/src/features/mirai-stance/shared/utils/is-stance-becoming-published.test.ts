import { describe, expect, it } from "vitest";
import { isStanceBecomingPublished } from "./is-stance-becoming-published";

describe("isStanceBecomingPublished", () => {
  it.each([
    ["非公開 → 公開", false, true],
    ["未登録 → 公開で作成", null, true],
    ["未登録 → isPublished 省略で作成（DB 既定値が公開）", null, undefined],
  ] as const)("%s は true を返す", (_, was, input) => {
    expect(isStanceBecomingPublished(was, input)).toBe(true);
  });

  it.each([
    ["公開 → 公開", true, true],
    ["公開 → isPublished 省略", true, undefined],
    ["公開 → 非公開", true, false],
    ["非公開 → 非公開", false, false],
    ["非公開 → isPublished 省略", false, undefined],
    ["未登録 → 非公開で作成", null, false],
  ] as const)("%s は false を返す", (_, was, input) => {
    expect(isStanceBecomingPublished(was, input)).toBe(false);
  });
});
