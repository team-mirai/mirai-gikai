import { describe, expect, it } from "vitest";
import { mergeMessagesWithIds } from "./merge-messages-with-ids";

describe("mergeMessagesWithIds", () => {
  it("userメッセージにdbMessagesのIDが付与される", () => {
    const client = [
      { role: "assistant", content: "質問1" },
      { role: "user", content: "回答1" },
      { role: "assistant", content: "質問2" },
      { role: "user", content: "回答2" },
    ];
    const db = [
      { id: "id-1", role: "user", content: "回答1" },
      { id: "id-2", role: "user", content: "回答2" },
    ];

    const result = mergeMessagesWithIds(client, db);

    expect(result).toEqual([
      { role: "assistant", content: "質問1" },
      { role: "user", content: "回答1", id: "id-1" },
      { role: "assistant", content: "質問2" },
      { role: "user", content: "回答2", id: "id-2" },
    ]);
  });

  it("assistantメッセージにはIDが付与されない", () => {
    const client = [
      { role: "assistant", content: "こんにちは" },
      { role: "assistant", content: "質問です" },
    ];
    const db = [{ id: "id-1", role: "assistant", content: "こんにちは" }];

    const result = mergeMessagesWithIds(client, db);

    expect(result).toEqual([
      { role: "assistant", content: "こんにちは" },
      { role: "assistant", content: "質問です" },
    ]);
  });

  it("空配列を渡した場合は空配列を返す", () => {
    expect(mergeMessagesWithIds([], [])).toEqual([]);
  });

  it("clientMessagesが空の場合は空配列を返す", () => {
    const db = [{ id: "id-1", role: "user", content: "回答" }];
    expect(mergeMessagesWithIds([], db)).toEqual([]);
  });

  it("dbMessagesが空の場合はIDなしでメッセージを返す", () => {
    const client = [
      { role: "user", content: "回答1" },
      { role: "user", content: "回答2" },
    ];

    const result = mergeMessagesWithIds(client, []);

    expect(result).toEqual([
      { role: "user", content: "回答1" },
      { role: "user", content: "回答2" },
    ]);
  });

  it("clientのuserメッセージがdbより多い場合、超過分はIDなし", () => {
    const client = [
      { role: "user", content: "回答1" },
      { role: "user", content: "回答2" },
      { role: "user", content: "回答3" },
    ];
    const db = [{ id: "id-1", role: "user", content: "回答1" }];

    const result = mergeMessagesWithIds(client, db);

    expect(result).toEqual([
      { role: "user", content: "回答1", id: "id-1" },
      { role: "user", content: "回答2" },
      { role: "user", content: "回答3" },
    ]);
  });
});
