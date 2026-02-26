import { describe, expect, it } from "vitest";
import { splitSentences } from "./split-sentences";

describe("splitSentences", () => {
  it("splits text on 。", () => {
    expect(splitSentences("こんにちは。お元気ですか。")).toEqual([
      "こんにちは。",
      "お元気ですか。",
    ]);
  });

  it("splits text on ？ and ！", () => {
    expect(splitSentences("本当ですか？すごい！")).toEqual([
      "本当ですか？",
      "すごい！",
    ]);
  });

  it("splits text on half-width ? and !", () => {
    expect(splitSentences("Really?Yes!")).toEqual(["Really?", "Yes!"]);
  });

  it("returns single element when no delimiter", () => {
    expect(splitSentences("区切りなしのテキスト")).toEqual([
      "区切りなしのテキスト",
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(splitSentences("")).toEqual([]);
  });

  it("handles mixed delimiters", () => {
    expect(splitSentences("まず最初に。次に質問です？最後に！")).toEqual([
      "まず最初に。",
      "次に質問です？",
      "最後に！",
    ]);
  });

  it("keeps trailing text without delimiter", () => {
    expect(splitSentences("はい。続きます")).toEqual(["はい。", "続きます"]);
  });
});
