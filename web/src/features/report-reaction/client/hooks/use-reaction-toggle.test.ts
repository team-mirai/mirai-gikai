// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReportReactionData } from "../../shared/types";
import { useReactionToggle } from "./use-reaction-toggle";

vi.mock("../../server/actions/toggle-reaction", () => ({
  toggleReaction: vi.fn(),
}));

import { toggleReaction } from "../../server/actions/toggle-reaction";

const mockedToggleReaction = vi.mocked(toggleReaction);

const initialData: ReportReactionData = {
  counts: { helpful: 3, hmm: 1 },
  userReaction: null,
};

describe("useReactionToggle", () => {
  it("楽観的にカウントとuserReactionを更新する", async () => {
    mockedToggleReaction.mockResolvedValue({
      success: true,
      newReaction: "helpful",
    });

    const { result } = renderHook(() =>
      useReactionToggle("report-1", initialData)
    );

    await act(async () => {
      await result.current.toggle("helpful");
    });

    expect(result.current.data.counts.helpful).toBe(4);
    expect(result.current.data.userReaction).toBe("helpful");
  });

  it("サーバーアクション失敗時にロールバックする", async () => {
    mockedToggleReaction.mockResolvedValue({
      success: false,
      error: "エラー",
      newReaction: null,
    });

    const { result } = renderHook(() =>
      useReactionToggle("report-1", initialData)
    );

    await act(async () => {
      await result.current.toggle("helpful");
    });

    expect(result.current.data.counts.helpful).toBe(3);
    expect(result.current.data.userReaction).toBeNull();
  });

  it("initialDataが変わったら同期する", () => {
    const { result, rerender } = renderHook(
      ({ data }) => useReactionToggle("report-1", data),
      { initialProps: { data: initialData } }
    );

    const updatedData: ReportReactionData = {
      counts: { helpful: 10, hmm: 2 },
      userReaction: "helpful",
    };

    rerender({ data: updatedData });

    expect(result.current.data.counts.helpful).toBe(10);
    expect(result.current.data.userReaction).toBe("helpful");
  });

  it("ネットワークエラー時にロールバックする", async () => {
    mockedToggleReaction.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useReactionToggle("report-1", initialData)
    );

    await act(async () => {
      await result.current.toggle("helpful");
    });

    expect(result.current.data.counts.helpful).toBe(3);
    expect(result.current.data.userReaction).toBeNull();
  });
});
