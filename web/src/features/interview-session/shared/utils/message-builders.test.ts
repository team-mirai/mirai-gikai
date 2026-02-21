import { describe, expect, it } from "vitest";
import { buildMessagesForApi } from "./message-builders";

describe("buildMessagesForApi", () => {
  it("initialとconversationを結合する", () => {
    const initial = [{ role: "assistant" as const, content: "初期メッセージ" }];
    const conversation = [
      { role: "user" as const, content: "ユーザー入力" },
      { role: "assistant" as const, content: "応答" },
    ];
    const result = buildMessagesForApi(initial, conversation);
    expect(result).toEqual([
      { role: "assistant", content: "初期メッセージ" },
      { role: "user", content: "ユーザー入力" },
      { role: "assistant", content: "応答" },
    ]);
  });

  it("newUserMessageがあれば末尾に追加する", () => {
    const initial = [{ role: "assistant" as const, content: "初期" }];
    const conversation = [{ role: "user" as const, content: "会話" }];
    const result = buildMessagesForApi(initial, conversation, "新しい入力");
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ role: "user", content: "新しい入力" });
  });

  it("newUserMessageが空文字なら追加しない", () => {
    const result = buildMessagesForApi([], [], "");
    expect(result).toHaveLength(0);
  });

  it("newUserMessageがundefinedなら追加しない", () => {
    const result = buildMessagesForApi([], []);
    expect(result).toHaveLength(0);
  });

  it("両方空配列なら空配列を返す", () => {
    expect(buildMessagesForApi([], [])).toEqual([]);
  });

  it("元の配列を変更しない", () => {
    const initial = [{ role: "assistant" as const, content: "初期" }];
    const conversation = [{ role: "user" as const, content: "会話" }];
    const initialCopy = [...initial];
    const conversationCopy = [...conversation];
    buildMessagesForApi(initial, conversation, "追加");
    expect(initial).toEqual(initialCopy);
    expect(conversation).toEqual(conversationCopy);
  });
});
