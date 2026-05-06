import { describe, expect, it } from "vitest";
import { getMessageDisplayText } from "./get-message-display-text";

describe("getMessageDisplayText", () => {
  it("extracts text from assistant message JSON", () => {
    expect(
      getMessageDisplayText(
        JSON.stringify({
          text: "表示する本文",
          quick_replies: ["A", "B"],
        })
      )
    ).toBe("表示する本文");
  });

  it("returns original content when JSON does not have a string text field", () => {
    const content = JSON.stringify({ text: null, quick_replies: ["A"] });

    expect(getMessageDisplayText(content)).toBe(content);
  });

  it("returns original content when content is plain text", () => {
    expect(getMessageDisplayText("そのままの本文")).toBe("そのままの本文");
  });
});
