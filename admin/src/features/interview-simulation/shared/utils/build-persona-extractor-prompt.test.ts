import { describe, expect, it } from "vitest";
import type { OriginalInterviewSnapshot } from "../types";
import { buildPersonaExtractorPrompt } from "./build-persona-extractor-prompt";

const baseSnapshot: OriginalInterviewSnapshot = {
  reportId: "report-1",
  sessionId: "session-1",
  configId: "config-1",
  billId: "bill-1",
  summary: "業務負担が増えるのが心配だが、安全のためなら必要かも",
  stance: "neutral",
  role: "work_related",
  roleTitle: "看護師",
  roleDescription: "都内総合病院で 10 年勤務する看護師",
  opinions: [
    {
      title: "業務負担増への懸念",
      content: "新しい記録項目が増えると現場が疲弊する",
      source_message_id: "m1",
    },
  ],
  conversation: [
    { role: "interviewer", content: "この法案についてどう思いますか？" },
    { role: "interviewee", content: "うーん、難しいですね。" },
  ],
  totalContentRichness: 6,
  rating: 4,
};

describe("buildPersonaExtractorPrompt", () => {
  it("元レポートの主要フィールドが含まれる", () => {
    const result = buildPersonaExtractorPrompt(baseSnapshot);
    expect(result).toContain("看護師");
    expect(result).toContain("10 年勤務");
    expect(result).toContain("neutral");
    expect(result).toContain("業務負担が増えるのが心配");
  });

  it("意見一覧が番号付きで含まれる", () => {
    const result = buildPersonaExtractorPrompt(baseSnapshot);
    expect(result).toContain("1. 業務負担増への懸念");
    expect(result).toContain("新しい記録項目が増えると現場が疲弊する");
  });

  it("会話ログがインタビュアー/インタビュイーラベル付きで含まれる", () => {
    const result = buildPersonaExtractorPrompt(baseSnapshot);
    expect(result).toContain(
      "[インタビュアー] この法案についてどう思いますか？"
    );
    expect(result).toContain("[インタビュイー] うーん、難しいですね。");
  });

  it("意見が空の場合はフォールバック表記", () => {
    const result = buildPersonaExtractorPrompt({
      ...baseSnapshot,
      opinions: [],
    });
    expect(result).toContain("（意見の抽出なし）");
  });

  it("会話が空の場合はフォールバック表記", () => {
    const result = buildPersonaExtractorPrompt({
      ...baseSnapshot,
      conversation: [],
    });
    expect(result).toContain("（会話ログなし）");
  });

  it("元レポートのフィールドが null でも落ちない", () => {
    const result = buildPersonaExtractorPrompt({
      ...baseSnapshot,
      summary: null,
      stance: null,
      roleTitle: null,
      roleDescription: null,
    });
    expect(result).toContain("（不明）");
  });
});
