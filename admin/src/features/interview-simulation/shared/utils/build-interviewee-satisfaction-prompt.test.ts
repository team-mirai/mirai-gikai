import { describe, expect, it } from "vitest";
import type { PersonaCharacterSheet, SimulatedTurn } from "../schemas";
import { buildIntervieweeSatisfactionPrompt } from "./build-interviewee-satisfaction-prompt";

const persona: PersonaCharacterSheet = {
  role_title: "射場運営者",
  role_description: "民間射場の開発・運用を担当",
  stance: "neutral",
  knowledge_level: "expert",
  speaking_style: "短く端的",
  background: "射場の運用現場で 10 年",
  key_concerns: ["安全審査の回転", "許可手続きの粒度"],
  typical_response_length: "medium",
  boundaries: [],
  message_to_politicians: [
    "射場の安全審査を案件ごとの個別審査から型式認定に切り替えてほしい。",
    "現行のままでは打上げ頻度が上がったときに審査が詰まる。",
  ],
};

const transcript: SimulatedTurn[] = [
  {
    role: "interviewer",
    content: "どういう立場で関わっていますか？",
    topic_title: null,
    question_id: null,
    next_stage: "chat",
    quick_replies: null,
  },
  {
    role: "interviewee",
    content: "射場運営です。",
    topic_title: null,
    question_id: null,
    next_stage: null,
    quick_replies: null,
  },
];

describe("buildIntervieweeSatisfactionPrompt", () => {
  it("persona の役割・スタンス・伝えたいことが箇条書きで含まれる", () => {
    const result = buildIntervieweeSatisfactionPrompt({ persona, transcript });
    expect(result).toContain(persona.role_title);
    expect(result).toContain(persona.role_description);
    for (const m of persona.message_to_politicians) {
      expect(result).toContain(`- ${m}`);
    }
  });

  it("transcript の各ターンが含まれる", () => {
    const result = buildIntervieweeSatisfactionPrompt({ persona, transcript });
    expect(result).toContain("どういう立場で関わっていますか？");
    expect(result).toContain("射場運営です。");
    expect(result).toContain("[インタビュアー]");
    expect(result).toContain("[インタビュイー]");
  });

  it("transcript が空でも壊れない", () => {
    const result = buildIntervieweeSatisfactionPrompt({
      persona,
      transcript: [],
    });
    expect(result).toContain("会話ログなし");
  });

  it("スコア基準の説明文が含まれる", () => {
    const result = buildIntervieweeSatisfactionPrompt({ persona, transcript });
    expect(result).toContain("5:");
    expect(result).toContain("1:");
    expect(result).toContain("uncovered_points");
  });
});
