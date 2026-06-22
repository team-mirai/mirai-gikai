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
    expect(mockPush).toHaveBeenCalledOnce();
    expect(typeof mockPush.mock.calls[0][0]).toBe("string");
  });

  it("アーカイブが失敗してもユーザーは法案詳細へ遷移させる", async () => {
    mockArchive.mockResolvedValue({ success: false, error: "boom" });

    const { result } = renderHook(() => useEndInterview("session-1", "bill-1"));

    await act(async () => {
      await result.current.endInterview();
    });

    expect(mockArchive).toHaveBeenCalledWith("session-1");
    expect(mockPush).toHaveBeenCalledOnce();
  });

  it("アーカイブが例外を投げてもユーザーは遷移させる", async () => {
    mockArchive.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useEndInterview("session-1", "bill-1"));

    await act(async () => {
      await result.current.endInterview();
    });

    expect(mockPush).toHaveBeenCalledOnce();
  });
});
