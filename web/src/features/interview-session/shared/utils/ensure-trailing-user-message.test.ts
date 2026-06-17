import { describe, expect, it } from "vitest";
import { ensureTrailingUserMessage } from "./ensure-trailing-user-message";

describe("ensureTrailingUserMessage", () => {
  it("末尾が user のときはそのまま返す", () => {
    const messages = [
      { role: "assistant", content: "質問です" },
      { role: "user", content: "回答です" },
    ];
    expect(ensureTrailingUserMessage(messages)).toEqual(messages);
  });

  it("末尾が assistant なら続行を促す user を補う", () => {
    const messages = [
      { role: "user", content: "回答です" },
      { role: "assistant", content: "最後の質問です" },
    ];
    const result = ensureTrailingUserMessage(messages);
    expect(result).toHaveLength(3);
    expect(result.at(-1)).toEqual({
      role: "user",
      content: "続けてください。",
    });
    // 元の配列は破壊しない
    expect(messages).toHaveLength(2);
  });

  it("空配列はそのまま返す", () => {
    expect(ensureTrailingUserMessage([])).toEqual([]);
  });
});
