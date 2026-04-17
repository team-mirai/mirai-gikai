import { describe, expect, it } from "vitest";
import type { CompletedReportListItem, PersonaSlotInput } from "../types";
import { describePersonaSlot } from "./describe-persona-slot";

const reports = new Map<string, CompletedReportListItem>([
  [
    "r1",
    {
      sessionId: "s1",
      reportId: "r1",
      configId: "c1",
      configName: "v1",
      roleTitle: "教員",
      role: null,
      stance: "for",
      summary: null,
      totalContentRichness: 80,
      completedAt: null,
    },
  ],
]);

describe("describePersonaSlot", () => {
  it("report ソース（ルックアップに存在する）は roleTitle と stance を表示", () => {
    const slot: PersonaSlotInput = { kind: "report", reportId: "r1" };
    expect(describePersonaSlot(slot, reports)).toBe("レポート: 教員 / 賛成");
  });

  it("report ソース（ルックアップ未提供）は reportId を短縮表示", () => {
    const slot: PersonaSlotInput = {
      kind: "report",
      reportId: "abcdef0123456789",
    };
    expect(describePersonaSlot(slot)).toBe("レポート: abcdef01…");
  });

  it("report ソース（ルックアップに存在しない）は reportId を短縮表示", () => {
    const slot: PersonaSlotInput = {
      kind: "report",
      reportId: "missing0-xxx",
    };
    expect(describePersonaSlot(slot, reports)).toBe("レポート: missing0…");
  });

  it("bill ソース（ヒント無し）は自動判定として表示", () => {
    const slot: PersonaSlotInput = { kind: "bill" };
    expect(describePersonaSlot(slot)).toBe("自動生成: 自動判定");
  });

  it("bill ソース（stanceHint のみ）は stance を表示", () => {
    const slot: PersonaSlotInput = { kind: "bill", stanceHint: "against" };
    expect(describePersonaSlot(slot)).toBe("自動生成: 反対");
  });

  it("bill ソース（role ヒント付き）は stance と role を表示", () => {
    const slot: PersonaSlotInput = {
      kind: "bill",
      stanceHint: "neutral",
      roleHint: "射場運用の民間事業者",
    };
    expect(describePersonaSlot(slot)).toBe(
      "自動生成: 中立 / 射場運用の民間事業者"
    );
  });

  it("bill ソース（roleHint が空白のみ）は role を表示しない", () => {
    const slot: PersonaSlotInput = {
      kind: "bill",
      stanceHint: "for",
      roleHint: "   ",
    };
    expect(describePersonaSlot(slot)).toBe("自動生成: 賛成");
  });
});
