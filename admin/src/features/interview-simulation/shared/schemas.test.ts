import { describe, expect, it } from "vitest";
import { AI_MODELS } from "@/lib/ai/models";
import { MAX_PERSONA_SLOTS } from "./constants";
import { multiSimulationRunRequestSchema } from "./schemas";
import type { PersonaSlotInput } from "./types";

type ValidRequest = {
  billId: string;
  personaSlots: PersonaSlotInput[];
  improvedConfig: {
    mode: "loop" | "bulk";
    themes: string[] | null;
    knowledgeSource: string | null;
    estimatedDurationMinutes: number | null;
    questions: Array<{
      id: string;
      question: string;
      quick_replies: string[] | null;
      follow_up_guide: string | null;
    }>;
  };
  interviewerModel: string;
  intervieweeModel: string;
  personaModel: string;
};

function baseValidRequest(): ValidRequest {
  return {
    billId: "bill-1",
    personaSlots: [{ kind: "bill" }],
    improvedConfig: {
      mode: "loop",
      themes: ["テーマ A"],
      knowledgeSource: "知識ソース",
      estimatedDurationMinutes: 30,
      questions: [
        {
          id: "q-1",
          question: "質問 1",
          quick_replies: ["はい", "いいえ"],
          follow_up_guide: "掘り下げガイド",
        },
      ],
    },
    interviewerModel: AI_MODELS.gpt5_2,
    intervieweeModel: AI_MODELS.gpt5_2,
    personaModel: AI_MODELS.gpt5_2,
  };
}

describe("multiSimulationRunRequestSchema", () => {
  it("最小構成の正しいリクエストを受理する", () => {
    const result = multiSimulationRunRequestSchema.safeParse(
      baseValidRequest()
    );
    expect(result.success).toBe(true);
  });

  it("personaSlots が空だと拒否", () => {
    const body = baseValidRequest();
    body.personaSlots = [];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("personaSlots が上限を超えると拒否", () => {
    const body = baseValidRequest();
    body.personaSlots = Array.from({ length: MAX_PERSONA_SLOTS + 1 }, () => ({
      kind: "bill",
    }));
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("personaSlots が上限ちょうどは受理", () => {
    const body = baseValidRequest();
    body.personaSlots = Array.from({ length: MAX_PERSONA_SLOTS }, () => ({
      kind: "bill",
    }));
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("トップレベルに未知フィールドがあると拒否", () => {
    const body = { ...baseValidRequest(), extra: "nope" };
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("personaSlot の bill ブランチに未知フィールドがあると拒否", () => {
    const body = baseValidRequest();
    body.personaSlots = [
      { kind: "bill", extra: "nope" } as unknown as { kind: "bill" },
    ];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("personaSlot の report ブランチに未知フィールドがあると拒否", () => {
    const body = baseValidRequest();
    body.personaSlots = [
      {
        kind: "report",
        reportId: "r-1",
        extra: "nope",
      } as unknown as PersonaSlotInput,
    ];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("reportId が空文字だと拒否", () => {
    const body = baseValidRequest();
    body.personaSlots = [
      { kind: "report", reportId: "" } as unknown as PersonaSlotInput,
    ];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("improvedConfig に未知フィールドがあると拒否", () => {
    const body = baseValidRequest();
    (body.improvedConfig as unknown as Record<string, unknown>).extra = "nope";
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("question オブジェクトに未知フィールドがあると拒否", () => {
    const body = baseValidRequest();
    (
      body.improvedConfig.questions[0] as unknown as Record<string, unknown>
    ).extra = "nope";
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("roleHint が 200 文字を超えると拒否", () => {
    const body = baseValidRequest();
    body.personaSlots = [{ kind: "bill", roleHint: "a".repeat(201) }];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("roleHint が 200 文字ちょうどは受理", () => {
    const body = baseValidRequest();
    body.personaSlots = [{ kind: "bill", roleHint: "a".repeat(200) }];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("roleHint が空文字 / 空白のみなら undefined に正規化される", () => {
    const body = baseValidRequest();
    body.personaSlots = [{ kind: "bill", roleHint: "   " }];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
    if (result.success) {
      const slot = result.data.personaSlots[0];
      expect(slot.kind).toBe("bill");
      if (slot.kind === "bill") {
        expect(slot.roleHint).toBeUndefined();
      }
    }
  });

  it("knowledgeSource が 20000 文字を超えると拒否", () => {
    const body = baseValidRequest();
    body.improvedConfig.knowledgeSource = "a".repeat(20_001);
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("question が 2000 文字を超えると拒否", () => {
    const body = baseValidRequest();
    body.improvedConfig.questions[0].question = "a".repeat(2_001);
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("themes 配列が 20 件を超えると拒否", () => {
    const body = baseValidRequest();
    body.improvedConfig.themes = Array.from({ length: 21 }, (_, i) => `t${i}`);
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("themes 要素が 200 文字を超えると拒否", () => {
    const body = baseValidRequest();
    body.improvedConfig.themes = ["a".repeat(201)];
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("billId が 100 文字を超えると拒否", () => {
    const body = baseValidRequest();
    body.billId = "a".repeat(101);
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("未知の AI モデルだと拒否", () => {
    const body = baseValidRequest();
    (body as unknown as Record<string, unknown>).interviewerModel =
      "openai/unknown-model";
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });

  it("estimatedDurationMinutes が 600 を超えると拒否", () => {
    const body = baseValidRequest();
    body.improvedConfig.estimatedDurationMinutes = 601;
    const result = multiSimulationRunRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });
});
