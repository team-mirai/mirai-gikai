import { describe, expect, it } from "vitest";
import { getSessionStatus } from "./get-session-status";

describe("getSessionStatus", () => {
  it("completed_atがある場合は'completed'を返す", () => {
    expect(getSessionStatus({ completed_at: "2024-01-01T12:00:00Z" })).toBe(
      "completed"
    );
  });

  it("completed_atがnullの場合は'in_progress'を返す", () => {
    expect(getSessionStatus({ completed_at: null })).toBe("in_progress");
  });
});
