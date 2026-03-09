import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callCompleteApi } from "./interview-api-client";

describe("callCompleteApi", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("正常レスポンス: report.idを含むレスポンスを返す", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ report: { id: "report-123" } }), {
        status: 200,
      })
    );

    const result = await callCompleteApi({
      sessionId: "session-1",
      isPublic: true,
    });

    expect(result).toEqual({ report: { id: "report-123" } });
  });

  it("エラーレスポンス(res.ok=false): data.errorメッセージでError throw", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
      })
    );

    await expect(
      callCompleteApi({ sessionId: "invalid", isPublic: false })
    ).rejects.toThrow("Session not found");
  });

  it('エラーレスポンスでjsonパースエラー: "Failed to complete interview"でError throw', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response("not json", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      })
    );

    await expect(
      callCompleteApi({ sessionId: "session-1", isPublic: true })
    ).rejects.toThrow("Failed to complete interview");
  });

  it("POSTメソッドで正しいbodyが送信される", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ report: { id: "r-1" } }), { status: 200 })
    );

    await callCompleteApi({ sessionId: "session-42", isPublic: false });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/interview/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "session-42", isPublic: false }),
    });
  });
});
