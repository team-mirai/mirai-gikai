import { describe, expect, it } from "vitest";
import { MAX_PERSONA_SLOTS } from "../constants";
import type { PersonaSlotInput } from "../types";
import { validatePersonaSlots } from "./validate-persona-slots";

describe("validatePersonaSlots", () => {
  it("0 件は ok=false", () => {
    expect(validatePersonaSlots([])).toEqual({
      ok: false,
      error: "ペルソナを 1 件以上選択してください",
    });
  });

  it("1 件（report）は ok", () => {
    const slots: PersonaSlotInput[] = [{ kind: "report", reportId: "r1" }];
    expect(validatePersonaSlots(slots)).toEqual({ ok: true });
  });

  it("1 件（bill）は ok", () => {
    const slots: PersonaSlotInput[] = [{ kind: "bill" }];
    expect(validatePersonaSlots(slots)).toEqual({ ok: true });
  });

  it("上限を超えると ok=false", () => {
    const slots: PersonaSlotInput[] = Array.from(
      { length: MAX_PERSONA_SLOTS + 1 },
      (_, i) => ({ kind: "report" as const, reportId: `r${i}` })
    );
    const result = validatePersonaSlots(slots);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(String(MAX_PERSONA_SLOTS));
    }
  });

  it("上限ちょうどは ok", () => {
    const slots: PersonaSlotInput[] = Array.from(
      { length: MAX_PERSONA_SLOTS },
      (_, i) => ({ kind: "report" as const, reportId: `r${i}` })
    );
    expect(validatePersonaSlots(slots)).toEqual({ ok: true });
  });

  it("同じ reportId を持つ report スロットが複数あると ok=false", () => {
    const slots: PersonaSlotInput[] = [
      { kind: "report", reportId: "r1" },
      { kind: "report", reportId: "r2" },
      { kind: "report", reportId: "r1" },
    ];
    expect(validatePersonaSlots(slots)).toEqual({
      ok: false,
      error: "同じレポートが複数のスロットに含まれています",
    });
  });

  it("bill スロットは stanceHint が同じでも重複扱いしない", () => {
    const slots: PersonaSlotInput[] = [
      { kind: "bill", stanceHint: "for" },
      { kind: "bill", stanceHint: "for" },
      { kind: "bill", stanceHint: "against" },
    ];
    expect(validatePersonaSlots(slots)).toEqual({ ok: true });
  });

  it("report と bill の混在は ok", () => {
    const slots: PersonaSlotInput[] = [
      { kind: "report", reportId: "r1" },
      { kind: "bill", stanceHint: "neutral" },
      { kind: "report", reportId: "r2" },
    ];
    expect(validatePersonaSlots(slots)).toEqual({ ok: true });
  });
});
