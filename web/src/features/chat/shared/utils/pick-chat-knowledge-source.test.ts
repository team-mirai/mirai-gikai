import { describe, expect, it } from "vitest";
import { pickChatKnowledgeSource } from "./pick-chat-knowledge-source";

describe("pickChatKnowledgeSource", () => {
  it("bill が null/undefined なら空文字", () => {
    expect(pickChatKnowledgeSource(null)).toBe("");
    expect(pickChatKnowledgeSource(undefined)).toBe("");
  });

  it("トグル OFF なら空文字（ナレッジ本文があっても無視）", () => {
    expect(
      pickChatKnowledgeSource({
        knowledge_source: "本文",
        use_knowledge_source_in_chat: false,
      })
    ).toBe("");
  });

  it("トグル ON でナレッジ本文があればその文字列を返す", () => {
    expect(
      pickChatKnowledgeSource({
        knowledge_source: "本文",
        use_knowledge_source_in_chat: true,
      })
    ).toBe("本文");
  });

  it("トグル ON でナレッジが null なら空文字", () => {
    expect(
      pickChatKnowledgeSource({
        knowledge_source: null,
        use_knowledge_source_in_chat: true,
      })
    ).toBe("");
  });
});
