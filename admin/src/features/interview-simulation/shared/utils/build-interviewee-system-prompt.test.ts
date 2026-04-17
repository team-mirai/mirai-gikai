import { describe, expect, it } from "vitest";
import type { PersonaCharacterSheet } from "../schemas";
import { buildIntervieweeSystemPrompt } from "./build-interviewee-system-prompt";

const basePersona: PersonaCharacterSheet = {
  role_title: "看護師",
  role_description: "都内総合病院で 10 年勤務する看護師",
  stance: "neutral",
  knowledge_level: "intermediate",
  speaking_style: "丁寧だが率直に答える",
  background: "医療現場の業務負担を肌で感じている",
  key_concerns: ["業務負担が増えないか", "患者の安全が確保されるか"],
  typical_response_length: "medium",
  boundaries: ["仮定の質問は避けたい"],
  message_to_politicians: [
    "現場の業務負担を踏まえた制度設計をしてほしい。",
    "特に夜勤帯の人員配置に配慮してほしい。",
  ],
};

describe("buildIntervieweeSystemPrompt", () => {
  it("ペルソナの基本情報が含まれる", () => {
    const result = buildIntervieweeSystemPrompt(basePersona);
    expect(result).toContain("看護師");
    expect(result).toContain("都内総合病院で 10 年勤務");
    expect(result).toContain("丁寧だが率直に答える");
    expect(result).toContain("医療現場の業務負担");
  });

  it("スタンスが日本語ラベルに変換される", () => {
    expect(
      buildIntervieweeSystemPrompt({ ...basePersona, stance: "for" })
    ).toContain("賛成");
    expect(
      buildIntervieweeSystemPrompt({ ...basePersona, stance: "against" })
    ).toContain("反対");
    expect(
      buildIntervieweeSystemPrompt({ ...basePersona, stance: "neutral" })
    ).toContain("どちらとも言えない");
  });

  it("knowledge_level が日本語ラベルに変換される", () => {
    expect(
      buildIntervieweeSystemPrompt({
        ...basePersona,
        knowledge_level: "beginner",
      })
    ).toContain("詳しくない");
    expect(
      buildIntervieweeSystemPrompt({
        ...basePersona,
        knowledge_level: "expert",
      })
    ).toContain("専門家");
  });

  it("typical_response_length のガイドが含まれる", () => {
    const short = buildIntervieweeSystemPrompt({
      ...basePersona,
      typical_response_length: "short",
    });
    expect(short).toContain("15 文字以下");

    const long = buildIntervieweeSystemPrompt({
      ...basePersona,
      typical_response_length: "long",
    });
    expect(long).toContain("数行");
  });

  it("key_concerns / boundaries が箇条書きで含まれる", () => {
    const result = buildIntervieweeSystemPrompt(basePersona);
    expect(result).toContain("- 業務負担が増えないか");
    expect(result).toContain("- 患者の安全が確保されるか");
    expect(result).toContain("- 仮定の質問は避けたい");
  });

  it("key_concerns / boundaries が空でもフォールバック表記で落ちない", () => {
    const result = buildIntervieweeSystemPrompt({
      ...basePersona,
      key_concerns: ["x"],
      boundaries: [],
    });
    expect(result).toContain("（特になし）");
  });

  it("AI / メタ発話禁止のルールが含まれる", () => {
    const result = buildIntervieweeSystemPrompt(basePersona);
    expect(result).toContain("AI であることを認めない");
    expect(result).toContain("メタ発話");
  });
});
