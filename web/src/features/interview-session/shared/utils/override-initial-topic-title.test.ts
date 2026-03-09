import { describe, expect, it } from "vitest";
import { overrideInitialTopicTitle } from "./override-initial-topic-title";

describe("overrideInitialTopicTitle", () => {
  it("topic_titleを「はじめに」に上書きする", () => {
    const input = JSON.stringify({
      text: "こんにちは！",
      topic_title: "経済政策",
      question_id: "q1",
      quick_replies: ["賛成", "反対"],
      next_stage: "chat",
    });

    const result = JSON.parse(overrideInitialTopicTitle(input));
    expect(result.topic_title).toBe("はじめに");
    expect(result.text).toBe("こんにちは！");
    expect(result.question_id).toBe("q1");
  });

  it("topic_titleがnullでも「はじめに」に上書きする", () => {
    const input = JSON.stringify({
      text: "こんにちは！",
      topic_title: null,
      next_stage: "chat",
    });

    const result = JSON.parse(overrideInitialTopicTitle(input));
    expect(result.topic_title).toBe("はじめに");
  });

  it("topic_titleが存在しない場合も追加する", () => {
    const input = JSON.stringify({
      text: "こんにちは！",
      next_stage: "chat",
    });

    const result = JSON.parse(overrideInitialTopicTitle(input));
    expect(result.topic_title).toBe("はじめに");
  });

  it("JSONでない文字列はそのまま返す", () => {
    const input = "これはただのテキスト";
    expect(overrideInitialTopicTitle(input)).toBe(input);
  });

  it("他のフィールドを変更しない", () => {
    const input = JSON.stringify({
      text: "インタビューを始めます",
      topic_title: "導入",
      question_id: "q1",
      quick_replies: ["はい", "いいえ"],
      next_stage: "chat",
    });

    const result = JSON.parse(overrideInitialTopicTitle(input));
    expect(result.text).toBe("インタビューを始めます");
    expect(result.question_id).toBe("q1");
    expect(result.quick_replies).toEqual(["はい", "いいえ"]);
    expect(result.next_stage).toBe("chat");
  });
});
