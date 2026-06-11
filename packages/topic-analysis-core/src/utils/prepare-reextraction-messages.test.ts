import { describe, expect, it } from "vitest";
import { prepareReextractionMessages } from "./prepare-reextraction-messages";

const chatAssistant = (text: string) =>
  JSON.stringify({ text, quick_replies: null, next_stage: "chat" });

describe("prepareReextractionMessages", () => {
  it("user は content+id、assistant は text へ整形する", () => {
    const result = prepareReextractionMessages([
      { id: "a1", role: "assistant", content: chatAssistant("最初の質問です") },
      { id: "u1", role: "user", content: "賛成です" },
    ]);
    expect(result).toEqual([
      { role: "assistant", content: "最初の質問です" },
      { role: "user", content: "賛成です", id: "u1" },
    ]);
  });

  it("レポート提示ターンの assistant は除外しつつ、要約フェーズのユーザー修正は保持する", () => {
    const result = prepareReextractionMessages([
      { id: "a1", role: "assistant", content: chatAssistant("質問1") },
      { id: "u1", role: "user", content: "回答1" },
      {
        id: "a2",
        role: "assistant",
        content: JSON.stringify({
          text: "まとめます",
          report: { summary: "x" },
        }),
      },
      // 要約提示後のユーザーの修正・追記は落とさない
      { id: "u2", role: "user", content: "やっぱり懸念も追記して" },
    ]);
    expect(result).toEqual([
      { role: "assistant", content: "質問1" },
      { role: "user", content: "回答1", id: "u1" },
      { role: "user", content: "やっぱり懸念も追記して", id: "u2" },
    ]);
  });

  it("next_stage=summary_complete の assistant も除外する", () => {
    const result = prepareReextractionMessages([
      { id: "u1", role: "user", content: "回答" },
      {
        id: "a1",
        role: "assistant",
        content: JSON.stringify({
          text: "完了",
          next_stage: "summary_complete",
        }),
      },
    ]);
    expect(result).toEqual([{ role: "user", content: "回答", id: "u1" }]);
  });

  it("レポートターンが無ければ全件残す", () => {
    const result = prepareReextractionMessages([
      { id: "a1", role: "assistant", content: chatAssistant("質問") },
      { id: "u1", role: "user", content: "回答" },
    ]);
    expect(result).toHaveLength(2);
  });

  it("JSONでない assistant 内容は原文をそのまま使う", () => {
    const result = prepareReextractionMessages([
      { id: "a1", role: "assistant", content: "プレーンな質問文" },
    ]);
    expect(result[0]).toEqual({
      role: "assistant",
      content: "プレーンな質問文",
    });
  });
});
