import { describe, expect, it } from "vitest";
import {
  isOpinionAudience,
  normalizeReasoningTypes,
  opinionPassesAudience,
} from "./opinion-tags";

describe("normalizeReasoningTypes", () => {
  it("null / undefined を空配列にする", () => {
    expect(normalizeReasoningTypes(null)).toEqual([]);
    expect(normalizeReasoningTypes(undefined)).toEqual([]);
  });

  // プロトタイプでは enum を強制していなかったため "evidence" / "n" 等が混入していた。
  it("既知の値だけを残す", () => {
    expect(
      normalizeReasoningTypes(["professional_expertise", "evidence", "n", ""])
    ).toEqual(["professional_expertise"]);
  });

  it("null / undefined 要素を落とす", () => {
    expect(
      normalizeReasoningTypes(["intuition", null, undefined])
    ).toEqual(["intuition"]);
  });

  it("重複を除去する", () => {
    expect(
      normalizeReasoningTypes(["intuition", "intuition", "overseas_example"])
    ).toEqual(["intuition", "overseas_example"]);
  });

  // none は「根拠の明示なし」なので他の根拠と同居させない。
  it("他の根拠があれば none を落とす", () => {
    expect(
      normalizeReasoningTypes(["professional_expertise", "none"])
    ).toEqual(["professional_expertise"]);
  });

  it("none だけなら残す", () => {
    expect(normalizeReasoningTypes(["none"])).toEqual(["none"]);
    expect(normalizeReasoningTypes(["none", "none"])).toEqual(["none"]);
  });

  it("順序を保持する", () => {
    expect(
      normalizeReasoningTypes(["personal_experience", "intuition"])
    ).toEqual(["personal_experience", "intuition"]);
  });
});

describe("isOpinionAudience", () => {
  it.each(["all", "experts", "specialists"])("%s を通す", (v) => {
    expect(isOpinionAudience(v)).toBe(true);
  });

  it.each([undefined, null, "", "expert", 1, {}])("%s を弾く", (v) => {
    expect(isOpinionAudience(v)).toBe(false);
  });
});

describe("opinionPassesAudience", () => {
  it("all はすべて通す", () => {
    expect(
      opinionPassesAudience("all", { role: null, reasoning_types: null })
    ).toBe(true);
  });

  describe("experts", () => {
    it.each(["daily_life_affected", "work_related", "subject_expert"])(
      "role=%s を通す",
      (role) => {
        expect(
          opinionPassesAudience("experts", { role, reasoning_types: null })
        ).toBe(true);
      }
    );

    it("general_citizen は専門知識を根拠にしていても除外する", () => {
      expect(
        opinionPassesAudience("experts", {
          role: "general_citizen",
          reasoning_types: ["professional_expertise"],
        })
      ).toBe(false);
    });

    it("role 未設定は除外する", () => {
      expect(
        opinionPassesAudience("experts", { role: null, reasoning_types: null })
      ).toBe(false);
    });
  });

  describe("specialists", () => {
    it("role=subject_expert なら根拠が空でも通す", () => {
      expect(
        opinionPassesAudience("specialists", {
          role: "subject_expert",
          reasoning_types: [],
        })
      ).toBe(true);
    });

    // role 単独では本番で全意見の1%未満しか拾えない。ここが本体。
    it("general_citizen でも professional_expertise を含めば通す", () => {
      expect(
        opinionPassesAudience("specialists", {
          role: "general_citizen",
          reasoning_types: ["personal_experience", "professional_expertise"],
        })
      ).toBe(true);
    });

    it("専門知識以外の根拠だけなら除外する", () => {
      expect(
        opinionPassesAudience("specialists", {
          role: "daily_life_affected",
          reasoning_types: ["personal_experience", "intuition"],
        })
      ).toBe(false);
    });

    it("タグ未抽出なら role のみで判定する", () => {
      expect(
        opinionPassesAudience("specialists", {
          role: "work_related",
          reasoning_types: null,
        })
      ).toBe(false);
    });
  });

  // UIで「全体 → 有識者 → 専門家」と段階的に並べると誤解を生む。
  it("specialists は experts の部分集合ではない", () => {
    const opinion = {
      role: "general_citizen",
      reasoning_types: ["professional_expertise"],
    };
    expect(opinionPassesAudience("experts", opinion)).toBe(false);
    expect(opinionPassesAudience("specialists", opinion)).toBe(true);
  });
});
