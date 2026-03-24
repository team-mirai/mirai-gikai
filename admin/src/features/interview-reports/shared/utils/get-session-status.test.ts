import { describe, expect, it } from "vitest";
import { getSessionStatus } from "./get-session-status";

describe("getSessionStatus", () => {
  it("completed_atがある場合は'completed'を返す", () => {
    expect(
      getSessionStatus({
        completed_at: "2024-01-01T12:00:00Z",
        archived_at: null,
      })
    ).toBe("completed");
  });

  it("completed_atがnullでarchived_atもnullの場合は'in_progress'を返す", () => {
    expect(getSessionStatus({ completed_at: null, archived_at: null })).toBe(
      "in_progress"
    );
  });

  it("completed_atがnullでarchived_atがある場合は'archived'を返す", () => {
    expect(
      getSessionStatus({
        completed_at: null,
        archived_at: "2024-01-01T12:00:00Z",
      })
    ).toBe("archived");
  });

  it("completed_atとarchived_atの両方がある場合は'completed'を返す", () => {
    expect(
      getSessionStatus({
        completed_at: "2024-01-01T12:00:00Z",
        archived_at: "2024-01-02T12:00:00Z",
      })
    ).toBe("completed");
  });
});
