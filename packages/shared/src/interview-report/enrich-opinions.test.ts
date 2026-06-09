import { describe, expect, it } from "vitest";
import { enrichOpinionsWithSourceContent } from "./enrich-opinions";

const messages = [
  { id: "u1", role: "user", content: "この法案に賛成です" },
  { id: "a1", role: "assistant", content: "なぜですか？" },
];

describe("enrichOpinionsWithSourceContent", () => {
  it("source_message_id を元のユーザー発言に解決して content を付与する", () => {
    const result = enrichOpinionsWithSourceContent(
      [{ title: "賛成", content: "理由", source_message_id: "u1" }],
      messages
    );
    expect(result[0]).toEqual({
      title: "賛成",
      content: "理由",
      source_message_id: "u1",
      source_message_content: "この法案に賛成です",
    });
  });

  it("解決できない id は null に正規化する", () => {
    const result = enrichOpinionsWithSourceContent(
      [{ title: "賛成", content: "理由", source_message_id: "missing" }],
      messages
    );
    expect(result[0].source_message_id).toBeNull();
    expect(result[0].source_message_content).toBeNull();
  });

  it("assistant メッセージは解決対象にしない", () => {
    const result = enrichOpinionsWithSourceContent(
      [{ title: "賛成", content: "理由", source_message_id: "a1" }],
      messages
    );
    expect(result[0].source_message_id).toBeNull();
    expect(result[0].source_message_content).toBeNull();
  });

  it("source_message_id が null/未指定なら content も null", () => {
    const result = enrichOpinionsWithSourceContent(
      [{ title: "賛成", content: "理由", source_message_id: null }],
      messages
    );
    expect(result[0].source_message_content).toBeNull();
  });

  it("新フィールド等の追加プロパティを保持する", () => {
    const result = enrichOpinionsWithSourceContent(
      [
        {
          title: "賛成",
          content: "理由",
          source_message_id: "u1",
          contextual_quote: "（法案について）賛成",
          bill_sentiment: "期待",
        },
      ],
      messages
    );
    expect(result[0]).toMatchObject({
      contextual_quote: "（法案について）賛成",
      bill_sentiment: "期待",
      source_message_content: "この法案に賛成です",
    });
  });
});
