import type { InterviewQuestion } from "@mirai-gikai/shared/interview-prompts/types";
import { describe, expect, it } from "vitest";
import { refreshStageGuidance } from "./refresh-stage-guidance";

const questions: InterviewQuestion[] = [
  { id: "q1", question: "賛否は？", quick_replies: ["賛成", "反対"] },
  { id: "q2", question: "立場は？", quick_replies: ["関係者", "一般"] },
  { id: "q3", question: "気になる点は？" },
];

describe("refreshStageGuidance", () => {
  it("マーカー以降を新しい進捗ガイダンスで差し替える", () => {
    const userPrompt = `冒頭のユーザー編集部分...

## ステージ遷移判定（next_stageフィールド）
古い内容…進捗 0/3 完了`;

    const result = refreshStageGuidance({
      userSystemPrompt: userPrompt,
      askedQuestionIds: new Set(["q1"]),
      questions,
      mode: "loop",
    });

    expect(result).toContain("冒頭のユーザー編集部分...");
    // 古い内容は消え、新しい内容になる
    expect(result).not.toContain("古い内容");
    expect(result).toContain("3問中1問完了（残り2問）");
    expect(result).toContain("[ID: q1]");
    expect(result).toContain("[ID: q2]");
    expect(result).toContain("[ID: q3]");
  });

  it("マーカーがなければ末尾に追記する", () => {
    const userPrompt = "編集したプロンプト本文のみ（ステージ遷移判定なし）";
    const result = refreshStageGuidance({
      userSystemPrompt: userPrompt,
      askedQuestionIds: new Set(),
      questions,
      mode: "loop",
    });
    expect(result.startsWith(userPrompt)).toBe(true);
    expect(result).toContain("## ステージ遷移判定");
    expect(result).toContain("3問中0問完了（残り3問）");
  });

  it("すべて完了している場合は「全部完了」を表示する", () => {
    const userPrompt = "...\n## ステージ遷移判定\n古い進捗";
    const result = refreshStageGuidance({
      userSystemPrompt: userPrompt,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
      questions,
      mode: "loop",
    });
    expect(result).toContain("3問中3問完了（残り0問）");
    expect(result).not.toContain("未回答の質問\n");
  });

  it("bulk mode では bulk 用のガイダンスを使う（一括回答優先モード専用ルールが含まれる）", () => {
    const userPrompt = "...\n## ステージ遷移判定\n古い内容";
    const result = refreshStageGuidance({
      userSystemPrompt: userPrompt,
      askedQuestionIds: new Set(["q1"]),
      questions,
      mode: "bulk",
    });
    expect(result).toContain("一括回答優先モード専用ルール");
  });

  it("loop mode では loop 用のガイダンスを使う（都度深掘りモードが含まれる）", () => {
    const userPrompt = "...\n## ステージ遷移判定\n古い内容";
    const result = refreshStageGuidance({
      userSystemPrompt: userPrompt,
      askedQuestionIds: new Set(),
      questions,
      mode: "loop",
    });
    expect(result).toContain("重要（都度深掘りモード）");
  });
});
