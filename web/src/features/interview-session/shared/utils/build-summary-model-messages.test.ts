import { describe, expect, it } from "vitest";
import { buildSummaryModelMessages } from "./build-summary-model-messages";

describe("buildSummaryModelMessages", () => {
  it("末尾が user のときは末尾の user メッセージ1件のみを返す（履歴の二重送信を防ぐ）", () => {
    const messages = [
      { role: "user", content: "賛成です" },
      { role: "assistant", content: "レポート案です" },
      { role: "user", content: "もっと簡潔にしてください" },
    ];
    expect(buildSummaryModelMessages(messages)).toEqual([
      { role: "user", content: "もっと簡潔にしてください" },
    ]);
    // 元の配列は破壊しない
    expect(messages).toHaveLength(3);
  });

  it("末尾が assistant のとき（chat→summary 自動遷移）はレポート作成を促す合成 user メッセージを返す", () => {
    const messages = [
      { role: "user", content: "賛成です" },
      { role: "assistant", content: "最後の質問です" },
    ];
    const result = buildSummaryModelMessages(messages);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
    expect(result[0].content).toContain("レポート");
  });

  it("空配列でも合成 user メッセージを返す（user で終わる列を保証する）", () => {
    const result = buildSummaryModelMessages([]);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
  });
});
