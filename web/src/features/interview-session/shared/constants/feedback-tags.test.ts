import { describe, expect, it } from "vitest";
import {
  FEEDBACK_RATING_THRESHOLD,
  FEEDBACK_TAGS,
  FEEDBACK_TAG_LABELS,
} from "./feedback-tags";

describe("feedback-tags", () => {
  it("すべてのタグにラベルが定義されている", () => {
    for (const tag of FEEDBACK_TAGS) {
      expect(FEEDBACK_TAG_LABELS[tag]).toBeDefined();
      expect(typeof FEEDBACK_TAG_LABELS[tag]).toBe("string");
      expect(FEEDBACK_TAG_LABELS[tag].length).toBeGreaterThan(0);
    }
  });

  it("タグの数とラベルの数が一致する", () => {
    expect(Object.keys(FEEDBACK_TAG_LABELS).length).toBe(FEEDBACK_TAGS.length);
  });

  it("フィードバック表示しきい値が3である", () => {
    expect(FEEDBACK_RATING_THRESHOLD).toBe(3);
  });
});
