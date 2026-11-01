import { describe, expect, it } from "vitest";
import { hasTextInLastStep, selectActiveChatTools } from "./chat-step-control";

describe("hasTextInLastStep", () => {
  it("ステップが無い場合は false を返す", () => {
    expect(hasTextInLastStep({ steps: [] })).toBe(false);
  });

  it("直前のステップがツール呼び出しのみの場合は false を返す", () => {
    expect(
      hasTextInLastStep({
        steps: [{ text: "", toolCalls: [{ toolName: "suggest_interview" }] }],
      })
    ).toBe(false);
  });

  it("直前のステップのテキストが空白のみの場合は false を返す", () => {
    expect(hasTextInLastStep({ steps: [{ text: " \n", toolCalls: [] }] })).toBe(
      false
    );
  });

  it("直前のステップにテキストがある場合は true を返す", () => {
    expect(
      hasTextInLastStep({
        steps: [
          {
            text: "ぜひインタビューにご協力ください。",
            toolCalls: [{ toolName: "suggest_interview" }],
          },
        ],
      })
    ).toBe(true);
  });
});

describe("selectActiveChatTools", () => {
  const toolNames = ["web_search", "suggest_interview"];

  it("suggest_interview 未呼び出しなら全ツールを返す", () => {
    expect(selectActiveChatTools(toolNames, [])).toEqual(toolNames);
  });

  it("suggest_interview 呼び出し済みなら除外する", () => {
    expect(
      selectActiveChatTools(toolNames, [
        { text: "", toolCalls: [{ toolName: "suggest_interview" }] },
      ])
    ).toEqual(["web_search"]);
  });

  it("他のツール呼び出しだけなら除外しない", () => {
    expect(
      selectActiveChatTools(toolNames, [
        { text: "", toolCalls: [{ toolName: "web_search" }] },
      ])
    ).toEqual(toolNames);
  });
});
