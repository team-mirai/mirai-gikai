import { describe, expect, it } from "vitest";
import { getMessageDisplayText } from "./get-message-display-text";

describe("getMessageDisplayText", () => {
  it("should extract text from JSON object with text field", () => {
    const json = JSON.stringify({
      text: "こんにちは",
      quick_replies: ["はい", "いいえ"],
    });
    expect(getMessageDisplayText(json)).toBe("こんにちは");
  });

  it("should return plain text as-is", () => {
    expect(getMessageDisplayText("普通のテキスト")).toBe("普通のテキスト");
  });

  it("should return original content when JSON has no text field", () => {
    const json = JSON.stringify({ quick_replies: ["はい"] });
    expect(getMessageDisplayText(json)).toBe(json);
  });

  it("should return original content for non-object JSON", () => {
    expect(getMessageDisplayText('"just a string"')).toBe('"just a string"');
  });

  it("should handle JSON with null text field", () => {
    const json = JSON.stringify({ text: null });
    expect(getMessageDisplayText(json)).toBe(json);
  });

  it("should handle empty string", () => {
    expect(getMessageDisplayText("")).toBe("");
  });

  it("should return original content when text field is not a string", () => {
    const json = JSON.stringify({ text: { nested: "value" } });
    expect(getMessageDisplayText(json)).toBe(json);
  });
});
