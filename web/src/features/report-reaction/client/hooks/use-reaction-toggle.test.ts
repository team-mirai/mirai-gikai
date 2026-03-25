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
  it("サーバー応答前に楽観的にUIを更新する", async () => {
    let resolve!: (value: {
      success: boolean;
      newReaction: "helpful" | null;
    }) => void;
    mockedToggleReaction.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );

    const { result } = renderHook(() =>
      useReactionToggle("report-1", initialData)
    );

    await act(async () => {
      void result.current.toggle("helpful");
    });

    // サーバー応答前に楽観的更新が反映されている
    expect(result.current.data.counts.helpful).toBe(4);
    expect(result.current.data.userReaction).toBe("helpful");

    // サーバー応答後も維持される
    await act(async () => {
      resolve({ success: true, newReaction: "helpful" });
    });

    expect(result.current.data.counts.helpful).toBe(4);
    expect(result.current.data.userReaction).toBe("helpful");
  });

  it("成功時にサーバー確定値でuserReactionを更新する", async () => {
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

  it("リクエスト中にinitialDataが変わった場合はロールバックをスキップする", async () => {
    let resolve!: (value: {
      success: boolean;
      error: string;
      newReaction: null;
    }) => void;
    mockedToggleReaction.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );

    const { result, rerender } = renderHook(
      ({ data }) => useReactionToggle("report-1", data),
      { initialProps: { data: initialData } }
    );

    // リアクションを押す
    await act(async () => {
      void result.current.toggle("helpful");
    });

    // リクエスト中にinitialDataが変わる（フィルタ切替等）
    const newData: ReportReactionData = {
      counts: { helpful: 20, hmm: 5 },
      userReaction: "helpful",
    };
    rerender({ data: newData });

    // サーバーが失敗を返す
    await act(async () => {
      resolve({ success: false, error: "エラー", newReaction: null });
    });

    // initialData同期が優先され、古いpreviousDataにロールバックしない
    expect(result.current.data.counts.helpful).toBe(20);
    expect(result.current.data.userReaction).toBe("helpful");
  });
});
