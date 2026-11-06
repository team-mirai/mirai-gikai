import { describe, expect, it } from "vitest";
import { reconcileOpinionTags } from "./reconcile-opinion-tags";

const tag = (
  opinion_index: number,
  overrides: Partial<{
    concern: string | null;
    proposal: string | null;
    reasoning_types: string[] | null;
  }> = {}
) => ({
  opinion_index,
  concern: "健康影響が心配",
  proposal: null,
  reasoning_types: ["personal_experience"],
  ...overrides,
});

describe("reconcileOpinionTags", () => {
  it("依頼した index の順序で updates を返す", () => {
    const result = reconcileOpinionTags([0, 1], [tag(1), tag(0)]);
    expect(result.updates.map((u) => u.opinionIndex)).toEqual([0, 1]);
    expect(result.missingIndexes).toEqual([]);
  });

  it("依頼していない index は捨てる", () => {
    const result = reconcileOpinionTags([0], [tag(0), tag(7)]);
    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].opinionIndex).toBe(0);
  });

  it("返ってこなかった index は missingIndexes に入れる", () => {
    const result = reconcileOpinionTags([0, 1, 2], [tag(1)]);
    expect(result.updates.map((u) => u.opinionIndex)).toEqual([1]);
    expect(result.missingIndexes).toEqual([0, 2]);
  });

  it("index が重複したら最初の1件を採用する", () => {
    const result = reconcileOpinionTags(
      [0],
      [tag(0, { concern: "さいしょ" }), tag(0, { concern: "あとの方" })]
    );
    expect(result.updates[0].concern).toBe("さいしょ");
  });

  it("未知の reasoning_types を落とす", () => {
    const result = reconcileOpinionTags(
      [0],
      [tag(0, { reasoning_types: ["professional_expertise", "evidence"] })]
    );
    expect(result.updates[0].reasoningTypes).toEqual([
      "professional_expertise",
    ]);
  });

  it("reasoning_types が null なら空配列にする", () => {
    const result = reconcileOpinionTags([0], [tag(0, { reasoning_types: null })]);
    expect(result.updates[0].reasoningTypes).toEqual([]);
  });

  it("空文字・空白のみの concern / proposal は null に寄せる", () => {
    const result = reconcileOpinionTags(
      [0],
      [tag(0, { concern: "", proposal: "   " })]
    );
    expect(result.updates[0].concern).toBeNull();
    expect(result.updates[0].proposal).toBeNull();
  });

  it("concern / proposal の前後空白を落とす", () => {
    const result = reconcileOpinionTags(
      [0],
      [tag(0, { concern: " 健康影響が心配 " })]
    );
    expect(result.updates[0].concern).toBe("健康影響が心配");
  });

  it("何も返ってこなければ全件 missing になる", () => {
    const result = reconcileOpinionTags([0, 1], []);
    expect(result.updates).toEqual([]);
    expect(result.missingIndexes).toEqual([0, 1]);
  });
});
