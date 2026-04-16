import { describe, expect, it } from "vitest";
import type { SimulatedTurn } from "../schemas";
import type { OriginalInterviewSnapshot } from "../types";
import { buildJudgeVsOriginalPrompt } from "./build-judge-vs-original-prompt";

const baseOriginal: OriginalInterviewSnapshot = {
  reportId: "r1",
  sessionId: "s1",
  configId: "c1",
  billId: "b1",
  summary: null,
  stance: "for",
  role: null,
  roleTitle: null,
  roleDescription: null,
  opinions: [],
  conversation: [
    { role: "interviewer", content: "賛成ですか？反対ですか？" },
    { role: "interviewee", content: "賛成です。" },
    { role: "interviewer", content: "理由を教えてください。" },
    { role: "interviewee", content: "現場の無駄が減るからです。" },
  ],
  totalContentRichness: null,
  rating: null,
};

const improvedTranscript: SimulatedTurn[] = [
  { role: "interviewer", content: "電子化についてどう思いますか？" },
  { role: "interviewee", content: "賛成ですね。" },
  { role: "interviewer", content: "具体的にはどの場面で効きますか？" },
  { role: "interviewee", content: "通関の待ち時間が減ります。" },
];

describe("buildJudgeVsOriginalPrompt", () => {
  it("元の会話・改善版 transcript・改善版 system prompt がすべて含まれる", () => {
    const result = buildJudgeVsOriginalPrompt({
      original: baseOriginal,
      improvedSimulation: {
        interviewerSystemPrompt: "改善版 system prompt 本文",
        transcript: improvedTranscript,
        stopReason: "summary" as const,
        askedPredefinedCount: 2,
        totalPredefinedCount: 4,
      },
    });
    expect(result).toContain("賛成ですか？反対ですか？");
    expect(result).toContain("電子化についてどう思いますか？");
    expect(result).toContain("改善版 system prompt 本文");
  });

  it("インタビュアー側のみ評価する旨が明記されている", () => {
    const result = buildJudgeVsOriginalPrompt({
      original: baseOriginal,
      improvedSimulation: {
        interviewerSystemPrompt: "x",
        transcript: improvedTranscript,
        stopReason: "summary" as const,
        askedPredefinedCount: 2,
        totalPredefinedCount: 4,
      },
    });
    expect(result).toContain("インタビュアー側の発話");
    expect(result).toContain(
      "インタビュイー側の発話の質・内容は**評価しない**"
    );
  });

  it("出力スキーマの主要フィールド説明が含まれる", () => {
    const result = buildJudgeVsOriginalPrompt({
      original: baseOriginal,
      improvedSimulation: {
        interviewerSystemPrompt: "x",
        transcript: improvedTranscript,
        stopReason: "summary" as const,
        askedPredefinedCount: 2,
        totalPredefinedCount: 4,
      },
    });
    expect(result).toContain("overall_verdict");
    expect(result).toContain("improved_strengths");
    expect(result).toContain("improved_weaknesses");
    expect(result).toContain("about_same");
  });

  it("元の会話もしくは改善版 transcript が空でも落ちない", () => {
    const result = buildJudgeVsOriginalPrompt({
      original: { ...baseOriginal, conversation: [] },
      improvedSimulation: {
        interviewerSystemPrompt: "x",
        transcript: [],
        stopReason: "summary" as const,
        askedPredefinedCount: 0,
        totalPredefinedCount: 4,
      },
    });
    expect(result).toContain("（会話なし）");
  });

  it("インタビュアー/インタビュイーラベルが付く", () => {
    const result = buildJudgeVsOriginalPrompt({
      original: baseOriginal,
      improvedSimulation: {
        interviewerSystemPrompt: "x",
        transcript: improvedTranscript,
        stopReason: "summary" as const,
        askedPredefinedCount: 2,
        totalPredefinedCount: 4,
      },
    });
    expect(result).toContain("[インタビュアー] 賛成ですか？反対ですか？");
    expect(result).toContain("[インタビュイー] 賛成です。");
  });
});
