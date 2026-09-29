import { describe, expect, it } from "vitest";
import { isMiraiStancePublished } from "./publish-schedule";

describe("isMiraiStancePublished", () => {
  const now = new Date("2026-10-01T12:00:00+09:00");

  it("publish_at が null なら即時公開扱い", () => {
    expect(isMiraiStancePublished(null, now)).toBe(true);
  });

  it("公開日時を過ぎていれば公開", () => {
    expect(isMiraiStancePublished("2026-10-01T11:59:00+09:00", now)).toBe(
      true
    );
  });

  it("公開日時ちょうどは公開", () => {
    expect(isMiraiStancePublished("2026-10-01T03:00:00+00:00", now)).toBe(
      true
    );
  });

  it("公開日時より前は非公開", () => {
    expect(isMiraiStancePublished("2026-10-01T12:00:01+09:00", now)).toBe(
      false
    );
  });

  it("不正な日時文字列は非公開に倒す", () => {
    expect(isMiraiStancePublished("invalid", now)).toBe(false);
  });
});
