import { describe, expect, it } from "vitest";
import type { PersonaCharacterSheet, SimulatedTurn } from "../schemas";
import type { OriginalInterviewSnapshot } from "../types";
import { buildJudgePrompt } from "./build-judge-prompt";

const persona: PersonaCharacterSheet = {
  role_title: "看護師",
  role_description: "10 年勤務",
  stance: "neutral",
  knowledge_level: "intermediate",
  speaking_style: "丁寧",
  background: "現場で勤務",
  key_concerns: ["業務負担", "患者の安全"],
  typical_response_length: "medium",
  boundaries: [],
};

const original: OriginalInterviewSnapshot = {
  reportId: "r1",
  sessionId: "s1",
  configId: "c1",
  billId: "b1",
  summary: null,
  stance: "neutral",
  role: null,
  roleTitle: null,
  roleDescription: null,
  opinions: [],
  conversation: [
    { role: "interviewer", content: "ご意見聞かせてください" },
    { role: "interviewee", content: "悩ましいです" },
  ],
  totalContentRichness: null,
  rating: null,
};

const currentTranscript: SimulatedTurn[] = [
  { role: "interviewer", content: "賛成ですか反対ですか？" },
  { role: "interviewee", content: "うーん、悩ましいです" },
  { role: "interviewer", content: "なぜそう思うのですか？" },
];

const improvedTranscript: SimulatedTurn[] = [
  { role: "interviewer", content: "現場でどのような不安がありますか？" },
  { role: "interviewee", content: "業務負担の増加が心配です" },
  { role: "interviewer", content: "具体的にどんな場面で感じますか？" },
];

describe("buildJudgePrompt", () => {
  it("ペルソナ・元会話・両シミュ結果がすべて含まれる", () => {
    const result = buildJudgePrompt({
      persona,
      original,
      currentSimulation: {
        interviewerSystemPrompt: "現行 system prompt 本文",
        transcript: currentTranscript,
      },
      improvedSimulation: {
        interviewerSystemPrompt: "改善版 system prompt 本文",
        transcript: improvedTranscript,
      },
    });

    // ペルソナ
    expect(result).toContain("看護師");
    expect(result).toContain("業務負担");
    // 元会話
    expect(result).toContain("ご意見聞かせてください");
    // current
    expect(result).toContain("現行 system prompt 本文");
    expect(result).toContain("賛成ですか反対ですか？");
    // improved
    expect(result).toContain("改善版 system prompt 本文");
    expect(result).toContain("現場でどのような不安");
  });

  it("インタビュアー / インタビュイーラベルが付く", () => {
    const result = buildJudgePrompt({
      persona,
      original,
      currentSimulation: {
        interviewerSystemPrompt: "x",
        transcript: currentTranscript,
      },
      improvedSimulation: {
        interviewerSystemPrompt: "y",
        transcript: improvedTranscript,
      },
    });
    expect(result).toContain("[インタビュアー] 賛成ですか反対ですか？");
    expect(result).toContain("[インタビュイー] うーん、悩ましいです");
  });

  it("空 transcript の場合はフォールバック表記", () => {
    const result = buildJudgePrompt({
      persona,
      original: { ...original, conversation: [] },
      currentSimulation: { interviewerSystemPrompt: "x", transcript: [] },
      improvedSimulation: {
        interviewerSystemPrompt: "y",
        transcript: improvedTranscript,
      },
    });
    expect(result).toContain("（会話なし）");
  });

  it("評価軸 5 つすべてが説明される", () => {
    const result = buildJudgePrompt({
      persona,
      original,
      currentSimulation: {
        interviewerSystemPrompt: "x",
        transcript: currentTranscript,
      },
      improvedSimulation: {
        interviewerSystemPrompt: "y",
        transcript: improvedTranscript,
      },
    });
    expect(result).toContain("question_diversity");
    expect(result).toContain("depth_of_followup");
    expect(result).toContain("flow_naturalness");
    expect(result).toContain("question_coverage");
    expect(result).toContain("persona_consistency");
  });
});
