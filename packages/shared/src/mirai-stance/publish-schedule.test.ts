import { describe, expect, it } from "vitest";
import { isMiraiStancePublished } from "./publish-schedule";

describe("isMiraiStancePublished", () => {
  const now = new Date("2026-10-01T12:00:00+09:00");
  const published = (publishAt: string | null) =>
    isMiraiStancePublished({ is_published: true, publish_at: publishAt }, now);

  it("publish_at が null なら即時公開扱い", () => {
    expect(published(null)).toBe(true);
  });

  it("公開日時を過ぎていれば公開", () => {
    expect(published("2026-10-01T11:59:00+09:00")).toBe(true);
  });

  it("公開日時ちょうどは公開", () => {
    expect(published("2026-10-01T03:00:00+00:00")).toBe(true);
  });

  it("公開日時より前は非公開", () => {
    expect(published("2026-10-01T12:00:01+09:00")).toBe(false);
  });

  it("不正な日時文字列は非公開に倒す", () => {
    expect(published("invalid")).toBe(false);
  });

  it("is_published が false なら publish_at に関わらず非公開", () => {
    expect(
      isMiraiStancePublished({ is_published: false, publish_at: null }, now)
    ).toBe(false);
    expect(
      isMiraiStancePublished(
        { is_published: false, publish_at: "2026-10-01T11:00:00+09:00" },
        now
      )
    ).toBe(false);
  });
});
