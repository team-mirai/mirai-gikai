import { describe, expect, it } from "vitest";
import { getMessageAnchorId } from "./message-anchor";

describe("getMessageAnchorId", () => {
  it("メッセージIDからアンカーIDを生成する", () => {
    expect(getMessageAnchorId("abc-123")).toBe("message-abc-123");
  });
});
