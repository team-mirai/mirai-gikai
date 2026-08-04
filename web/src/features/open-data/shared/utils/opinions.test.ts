import { describe, expect, it } from "vitest";
import { toOpenDataOpinions } from "./opinions";

describe("toOpenDataOpinions", () => {
  it("title/content のみを抽出し内部メタデータを含めない", () => {
    const opinions = toOpenDataOpinions([
      {
        title: "賛成の理由",
        content: "社会全体の利益になる",
        source_message_id: "message-1",
        source_message_content: "元発言",
        richness: 70,
      },
    ]);

    expect(opinions).toEqual([
      { title: "賛成の理由", content: "社会全体の利益になる" },
    ]);
  });

  it("配列でない値は空配列", () => {
    expect(toOpenDataOpinions(null)).toEqual([]);
    expect(toOpenDataOpinions({ title: "x", content: "y" })).toEqual([]);
  });

  it("title/content が欠けた要素は除外する", () => {
    const opinions = toOpenDataOpinions([
      { title: "有効", content: "本文" },
      { title: "contentなし" },
      { content: "titleなし" },
      null,
    ]);

    expect(opinions).toEqual([{ title: "有効", content: "本文" }]);
  });
});
