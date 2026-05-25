import { describe, expect, it } from "vitest";
import { buildTargetedModeSystemPrompt } from "./targeted-mode";
import type { InterviewPromptInput } from "./types";

function baseParams(
  overrides: Partial<InterviewPromptInput> = {}
): InterviewPromptInput {
  return {
    bill: {
      name: "テスト法案",
      bill_content: {
        title: "テスト法案タイトル",
        summary: "要約",
        content: "本文",
      },
      knowledge_source: "参考資料",
    },
    interviewConfig: { themes: ["テーマA"] },
    questions: [],
    currentStage: "chat",
    askedQuestionIds: new Set<string>(),
    remainingMinutes: null,
    ...overrides,
  };
}

describe("buildTargetedModeSystemPrompt", () => {
  it("対象者条件が指定された質問は対象者ラベルを出力する", () => {
    const prompt = buildTargetedModeSystemPrompt(
      baseParams({
        questions: [
          {
            id: "q1",
            question: "専門家としてどう評価しますか？",
            target_audience: "当該法案分野の専門家",
          },
        ],
      })
    );
    expect(prompt).toContain("対象者: 当該法案分野の専門家");
    expect(prompt).toContain("専門家としてどう評価しますか？");
  });

  it("対象者条件がない質問は『全員（条件なし）』と明示される", () => {
    const prompt = buildTargetedModeSystemPrompt(
      baseParams({
        questions: [{ id: "q1", question: "全員に聞きたい質問" }],
      })
    );
    expect(prompt).toContain("対象者: 全員（条件なし）");
  });

  it("対象者条件に基づくスキップ判定セクションを含む", () => {
    const prompt = buildTargetedModeSystemPrompt(baseParams());
    expect(prompt).toContain("## 対象者条件に基づくスキップ判定");
    expect(prompt).toContain("スクリーニングのためだけの確認質問");
    expect(prompt).toContain("対象者指定モード");
  });

  it("スキップ発言を禁止するルールを含む", () => {
    const prompt = buildTargetedModeSystemPrompt(baseParams());
    expect(prompt).toContain("スキップを絶対に言及しない");
    expect(prompt).toContain("完全に存在しないものとして扱い");
  });

  it("follow_up_guide と quick_replies は loop-mode と同様に表示される", () => {
    const prompt = buildTargetedModeSystemPrompt(
      baseParams({
        questions: [
          {
            id: "q1",
            question: "立場を教えてください",
            follow_up_guide: "回答に応じて深掘り",
            quick_replies: ["賛成", "反対"],
            target_audience: null,
          },
        ],
      })
    );
    expect(prompt).toContain("フォローアップ指針: 回答に応じて深掘り");
    expect(prompt).toContain("クイックリプライ: 賛成, 反対");
  });
});
