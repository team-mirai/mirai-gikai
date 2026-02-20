import { describe, expect, it } from "vitest";
import { isEndMessage, isSkipMessage } from "./skip-detection";

describe("isSkipMessage", () => {
  it("UIのスキップボタンメッセージを検出する", () => {
    expect(isSkipMessage("次のテーマに進みたいです")).toBe(true);
  });

  it("部分一致の「次のテーマに進みたい」を検出する", () => {
    expect(isSkipMessage("次のテーマに進みたい")).toBe(true);
  });

  it("「スキップ」を含むメッセージを検出する", () => {
    expect(isSkipMessage("この質問をスキップしたい")).toBe(true);
  });

  it("「次の質問」を含むメッセージを検出する", () => {
    expect(isSkipMessage("次の質問に進んでください")).toBe(true);
  });

  it("通常の回答メッセージはスキップではない", () => {
    expect(isSkipMessage("私は賛成です")).toBe(false);
  });

  it("終了希望メッセージはスキップではない", () => {
    expect(isSkipMessage("もう終わりにしたいです")).toBe(false);
  });

  it("空文字列はスキップではない", () => {
    expect(isSkipMessage("")).toBe(false);
  });

  it("スキップと終了が混在する場合は終了を優先しスキップではない", () => {
    expect(isSkipMessage("残りはスキップして終わりにしたい")).toBe(false);
  });

  it("スキップと終了が混在する場合（終了したい）", () => {
    expect(isSkipMessage("全部スキップして終了したい")).toBe(false);
  });

  it("「スキップして終了します」は終了を優先", () => {
    expect(isSkipMessage("スキップして終了します")).toBe(false);
  });

  it("「スキップして終わりです」は終了を優先", () => {
    expect(isSkipMessage("スキップして終わりです")).toBe(false);
  });
});

describe("isEndMessage", () => {
  it("「終わりにしたい」を検出する", () => {
    expect(isEndMessage("もう終わりにしたいです")).toBe(true);
  });

  it("「終了したい」を検出する", () => {
    expect(isEndMessage("インタビューを終了したい")).toBe(true);
  });

  it("「終了します」を検出する", () => {
    expect(isEndMessage("スキップして終了します")).toBe(true);
  });

  it("「終わりです」を検出する", () => {
    expect(isEndMessage("スキップして終わりです")).toBe(true);
  });

  it("「以上です」を検出する", () => {
    expect(isEndMessage("以上です")).toBe(true);
  });

  it("通常の回答は終了ではない", () => {
    expect(isEndMessage("私は賛成です")).toBe(false);
  });

  it("スキップメッセージは終了ではない", () => {
    expect(isEndMessage("次のテーマに進みたいです")).toBe(false);
  });
});
