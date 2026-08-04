import { describe, expect, it } from "vitest";
import { toOpenDataMessage } from "./to-open-data-message";

describe("toOpenDataMessage", () => {
  it("assistantの構造化JSONからは表示テキストのみを返す", () => {
    const content = JSON.stringify({
      text: "ご意見ありがとうございます。",
      next_stage: "closing",
      report: {
        summary: "内部メタデータ",
        opinions: [
          {
            title: "t",
            content: "c",
            source_message_id: "m-1",
            contextual_quote: "引用",
          },
        ],
        content_richness: { total: 80 },
      },
    });

    expect(toOpenDataMessage({ role: "assistant", content })).toEqual({
      role: "assistant",
      content: "ご意見ありがとうございます。",
    });
  });

  it("assistantのプレーンテキストはそのまま返す", () => {
    expect(
      toOpenDataMessage({ role: "assistant", content: "こんにちは" })
    ).toEqual({ role: "assistant", content: "こんにちは" });
  });

  it("userのcontentはJSON風の文字列でも変換しない", () => {
    const content = '{"text":"ユーザーが入力したJSON風の文章"}';
    expect(toOpenDataMessage({ role: "user", content })).toEqual({
      role: "user",
      content,
    });
  });
});
