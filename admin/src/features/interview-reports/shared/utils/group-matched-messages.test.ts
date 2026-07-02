import { describe, expect, it } from "vitest";
import type { MatchedUserMessage } from "../types";
import { groupMatchedMessagesBySession } from "./group-matched-messages";

function makeMessage(
  id: string,
  sessionId: string,
  createdAt: string
): MatchedUserMessage {
  return {
    id,
    interview_session_id: sessionId,
    content: `message ${id}`,
    created_at: createdAt,
  };
}

describe("groupMatchedMessagesBySession", () => {
  it("セッションごとにメッセージをまとめる", () => {
    // 入力は created_at 降順
    const messages = [
      makeMessage("m3", "s1", "2026-01-03T00:00:00Z"),
      makeMessage("m2", "s2", "2026-01-02T00:00:00Z"),
      makeMessage("m1", "s1", "2026-01-01T00:00:00Z"),
    ];

    const groups = groupMatchedMessagesBySession(messages);

    expect(groups).toHaveLength(2);
    expect(groups[0].sessionId).toBe("s1");
    expect(groups[1].sessionId).toBe("s2");
  });

  it("セッションは最新の一致メッセージが新しい順に並ぶ", () => {
    const messages = [
      makeMessage("m3", "s2", "2026-01-03T00:00:00Z"),
      makeMessage("m2", "s1", "2026-01-02T00:00:00Z"),
      makeMessage("m1", "s2", "2026-01-01T00:00:00Z"),
    ];

    const groups = groupMatchedMessagesBySession(messages);

    expect(groups.map((g) => g.sessionId)).toEqual(["s2", "s1"]);
  });

  it("セッション内のメッセージは時系列（昇順）に並ぶ", () => {
    const messages = [
      makeMessage("m3", "s1", "2026-01-03T00:00:00Z"),
      makeMessage("m2", "s1", "2026-01-02T00:00:00Z"),
      makeMessage("m1", "s1", "2026-01-01T00:00:00Z"),
    ];

    const groups = groupMatchedMessagesBySession(messages);

    expect(groups[0].messages.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("空の入力は空の配列を返す", () => {
    expect(groupMatchedMessagesBySession([])).toEqual([]);
  });
});
