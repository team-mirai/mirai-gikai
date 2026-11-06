import { describe, expect, it } from "vitest";
import { resolveStanceWriteFailure } from "./resolve-stance-write-failure";

describe("resolveStanceWriteFailure", () => {
  it("スタンスが無ければ not_found", () => {
    expect(resolveStanceWriteFailure(null)).toBe("not_found");
  });

  it("公開済みなら already_published", () => {
    expect(resolveStanceWriteFailure({ is_published: true })).toBe(
      "already_published"
    );
  });

  it("非公開のまま残っていれば stale", () => {
    expect(resolveStanceWriteFailure({ is_published: false })).toBe("stale");
  });
});
