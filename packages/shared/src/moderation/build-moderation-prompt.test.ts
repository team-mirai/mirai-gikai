import { describe, expect, it } from "vitest";
import { buildModerationPrompt } from "./build-moderation-prompt";

describe("buildModerationPrompt", () => {
  it("すべてのフィールドが含まれるプロンプトを生成する", () => {
    const prompt = buildModerationPrompt({
      summary: "物流コスト削減を期待する",
      opinions: [
        { title: "コスト削減", content: "物流業者として運送費の低減に期待" },
        { title: "雇用への影響", content: "ドライバーの雇用が心配" },
      ],
      roleDescription: "物流業者として10年の経験がある",
      messages: [
        { role: "assistant", content: "本日はよろしくお願いします。" },
        { role: "user", content: "物流コストについて話したいです。" },
      ],
    });

    expect(prompt).toContain("物流コスト削減を期待する");
    expect(prompt).toContain("コスト削減");
    expect(prompt).toContain("物流業者として運送費の低減に期待");
    expect(prompt).toContain("雇用への影響");
    expect(prompt).toContain("物流業者として10年の経験がある");
    expect(prompt).toContain("[assistant] 本日はよろしくお願いします。");
    expect(prompt).toContain("[user] 物流コストについて話したいです。");
  });

  it("すべてのフィールドがnull/空でもプロンプトを生成できる", () => {
    const prompt = buildModerationPrompt({
      summary: null,
      opinions: null,
      roleDescription: null,
      messages: [],
    });

    expect(prompt).toContain("（内容なし）");
    expect(prompt).toContain("評価カテゴリ");
  });

  it("空の意見配列でもプロンプトを生成できる", () => {
    const prompt = buildModerationPrompt({
      summary: "テスト要約",
      opinions: [],
      roleDescription: null,
      messages: [],
    });

    expect(prompt).toContain("テスト要約");
    expect(prompt).not.toContain("## 意見");
  });

  it("会話ログのみでもプロンプトを生成できる", () => {
    const prompt = buildModerationPrompt({
      summary: null,
      opinions: null,
      roleDescription: null,
      messages: [{ role: "user", content: "テストメッセージ" }],
    });

    expect(prompt).toContain("## 会話ログ");
    expect(prompt).toContain("[user] テストメッセージ");
    expect(prompt).not.toContain("（内容なし）");
  });

  it("13の評価カテゴリがすべて含まれる", () => {
    const prompt = buildModerationPrompt({
      summary: "テスト",
      opinions: null,
      roleDescription: null,
      messages: [],
    });

    const categories = [
      "個人情報の開示",
      "違法行為の助長",
      "知的財産権の侵害",
      "自傷・脅迫",
      "わいせつ・暴力的表現",
      "名誉毀損・過度な批判",
      "差別・ヘイトスピーチ",
      "不謹慎な内容",
      "無関係な内容",
      "虚偽情報",
      "スパム・妨害行為",
      "商業的宣伝",
      "なりすまし",
    ];
    for (const category of categories) {
      expect(prompt).toContain(category);
    }
  });
});
