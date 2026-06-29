import { describe, expect, it } from "vitest";
import { normalizeStanceToSentiment } from "./normalize-stance";

describe("normalizeStanceToSentiment", () => {
  it("for を 期待 に正規化する", () => {
    expect(normalizeStanceToSentiment("for")).toBe("期待");
  });

  it("against を 懸念 に正規化する", () => {
    expect(normalizeStanceToSentiment("against")).toBe("懸念");
  });

  it("neutral・未知の値・null は null を返す", () => {
    expect(normalizeStanceToSentiment("neutral")).toBeNull();
    expect(normalizeStanceToSentiment("unknown")).toBeNull();
    expect(normalizeStanceToSentiment(null)).toBeNull();
  });
});
