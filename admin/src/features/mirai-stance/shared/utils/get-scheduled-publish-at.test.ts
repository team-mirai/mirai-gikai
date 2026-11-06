import { describe, expect, it } from "vitest";
import { getScheduledPublishAt } from "./get-scheduled-publish-at";

describe("getScheduledPublishAt", () => {
  const now = new Date("2026-10-01T12:00:00+09:00");
  const future = "2026-10-01T13:00:00+09:00";

  it("公開設定かつ公開日時前なら公開日時を返す", () => {
    expect(
      getScheduledPublishAt({ is_published: true, publish_at: future }, now)
    ).toBe(future);
  });

  it("公開日時を過ぎていれば null を返す", () => {
    expect(
      getScheduledPublishAt(
        { is_published: true, publish_at: "2026-10-01T11:00:00+09:00" },
        now
      )
    ).toBeNull();
  });

  it("公開日時が未設定なら null を返す", () => {
    expect(
      getScheduledPublishAt({ is_published: true, publish_at: null }, now)
    ).toBeNull();
  });

  it("非公開なら公開日時が残っていても null を返す", () => {
    expect(
      getScheduledPublishAt({ is_published: false, publish_at: future }, now)
    ).toBeNull();
  });

  it("スタンス未作成なら null を返す", () => {
    expect(getScheduledPublishAt(null, now)).toBeNull();
  });
});
