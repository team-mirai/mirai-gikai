import { describe, expect, it } from "vitest";
import { escapeIlikePattern } from "./escape-ilike-pattern";

describe("escapeIlikePattern", () => {
  it("通常の文字列はそのまま返す", () => {
    expect(escapeIlikePattern("子育て支援")).toBe("子育て支援");
  });

  it("% をエスケープする", () => {
    expect(escapeIlikePattern("100%")).toBe("100\\%");
  });

  it("_ をエスケープする", () => {
    expect(escapeIlikePattern("user_name")).toBe("user\\_name");
  });

  it("バックスラッシュをエスケープする", () => {
    expect(escapeIlikePattern("a\\b")).toBe("a\\\\b");
  });

  it("複数の特殊文字が混在してもすべてエスケープする", () => {
    expect(escapeIlikePattern("%_\\")).toBe("\\%\\_\\\\");
  });

  it("空文字列は空文字列を返す", () => {
    expect(escapeIlikePattern("")).toBe("");
  });
});
