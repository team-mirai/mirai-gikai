// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockArchive, mockPush } = vi.hoisted(() => ({
  mockArchive: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("../../server/actions/archive-interview-session", () => ({
  archiveInterviewSession: mockArchive,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { useEndInterview } from "./use-end-interview";

describe("useEndInterview", () => {
  beforeEach(() => {
    mockArchive.mockReset();
    mockPush.mockReset();
  });

  it("セッションをアーカイブしてから法案詳細へ遷移する", async () => {
    mockArchive.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useEndInterview("session-1", "bill-1"));

    await act(async () => {
      await result.current.endInterview();
    });

    expect(mockArchive).toHaveBeenCalledWith("session-1");
    expect(mockPush).toHaveBeenCalledWith("/bills/bill-1");
    // archive → push の順序を固定（順序逆転の回帰を検出）
    expect(mockArchive.mock.invocationCallOrder[0]).toBeLessThan(
      mockPush.mock.invocationCallOrder[0]
    );
  });

  it("previewToken 付きではプレビュー詳細URLへ遷移する", async () => {
    mockArchive.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useEndInterview("session-1", "bill-1", "token-1")
    );

    await act(async () => {
      await result.current.endInterview();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/preview/bills/bill-1?token=token-1"
    );
  });

  it("連続呼び出しでも archive と push は一度だけ実行される（再入ガード）", async () => {
    mockArchive.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useEndInterview("session-1", "bill-1"));

    await act(async () => {
      // setIsEnding の反映を待たずに連続実行
      await Promise.all([
        result.current.endInterview(),
        result.current.endInterview(),
      ]);
    });

    expect(mockArchive).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("アーカイブが失敗してもユーザーは法案詳細へ遷移させる", async () => {
    mockArchive.mockResolvedValue({ success: false, error: "boom" });

    const { result } = renderHook(() => useEndInterview("session-1", "bill-1"));

    await act(async () => {
      await result.current.endInterview();
    });

    expect(mockArchive).toHaveBeenCalledWith("session-1");
    expect(mockPush).toHaveBeenCalledWith("/bills/bill-1");
  });

  it("アーカイブが例外を投げてもユーザーは遷移させる", async () => {
    mockArchive.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useEndInterview("session-1", "bill-1"));

    await act(async () => {
      await result.current.endInterview();
    });

    expect(mockPush).toHaveBeenCalledWith("/bills/bill-1");
  });
});
