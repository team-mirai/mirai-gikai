import { describe, expect, it } from "vitest";
import type { SimulatedTurn } from "../schemas";
import { formatTranscriptToMarkdown, isShortAnswer } from "./format-transcript";

describe("formatTranscriptToMarkdown", () => {
  it("空配列の場合は会話なし表記を返す", () => {
    expect(formatTranscriptToMarkdown([])).toContain("会話なし");
  });

  it("インタビュアー / インタビュイーをラベル付きで連結する", () => {
    const turns: SimulatedTurn[] = [
      { role: "interviewer", content: "賛成ですか反対ですか？" },
      { role: "interviewee", content: "賛成です。" },
    ];
    const result = formatTranscriptToMarkdown(turns);
    expect(result).toContain("インタビュアー");
    expect(result).toContain("インタビュイー");
    expect(result).toContain("賛成ですか反対ですか？");
    expect(result).toContain("賛成です。");
  });

  it("ターン番号が 1 から付与される", () => {
    const turns: SimulatedTurn[] = [
      { role: "interviewer", content: "Q1" },
      { role: "interviewee", content: "A1" },
      { role: "interviewer", content: "Q2" },
    ];
    const result = formatTranscriptToMarkdown(turns);
    expect(result).toContain("**1. インタビュアー**");
    expect(result).toContain("**2. インタビュイー**");
    expect(result).toContain("**3. インタビュアー**");
  });

  it("topic_title / question_id / next_stage がメタ情報として付与される", () => {
    const turns: SimulatedTurn[] = [
      {
        role: "interviewer",
        content: "業務への影響は？",
        topic_title: "業務影響",
        question_id: "q-42",
        next_stage: "chat",
      },
    ];
    const result = formatTranscriptToMarkdown(turns);
    expect(result).toContain("topic: 業務影響");
    expect(result).toContain("q: q-42");
    // chat は通常状態なので省略
    expect(result).not.toContain("next: chat");
  });

  it("next_stage=summary の場合はメタに含む", () => {
    const turns: SimulatedTurn[] = [
      {
        role: "interviewer",
        content: "ありがとうございました",
        next_stage: "summary",
      },
    ];
    expect(formatTranscriptToMarkdown(turns)).toContain("next: summary");
  });
});

describe("isShortAnswer", () => {
  it("15 文字以下は short", () => {
    expect(isShortAnswer("はい")).toBe(true);
    expect(isShortAnswer("そう思います")).toBe(true);
    expect(isShortAnswer("123456789012345")).toBe(true); // 15
  });

  it("16 文字以上は short ではない", () => {
    expect(isShortAnswer("1234567890123456")).toBe(false);
    expect(isShortAnswer("これはそれなりに長い回答だと思います")).toBe(false);
  });

  it("前後の空白はトリムして判定する", () => {
    expect(isShortAnswer("  はい  ")).toBe(true);
  });
});
