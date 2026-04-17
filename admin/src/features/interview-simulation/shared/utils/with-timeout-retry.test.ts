import { describe, expect, it, vi } from "vitest";
import { withTimeoutRetry } from "./with-timeout-retry";

describe("withTimeoutRetry", () => {
  it("1 回目で成功すればそのまま返す", async () => {
    const fn = vi.fn(async () => "ok");
    const result = await withTimeoutRetry(fn, {
      timeoutMs: 100,
      maxAttempts: 3,
    });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("一時的エラーは maxAttempts まで再試行する", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("ok");
    const result = await withTimeoutRetry(fn, {
      timeoutMs: 100,
      maxAttempts: 3,
      retryBackoffMs: 1,
    });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("maxAttempts 到達で最終エラーを throw", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fail"));
    await expect(
      withTimeoutRetry(fn, {
        timeoutMs: 100,
        maxAttempts: 2,
        retryBackoffMs: 1,
      })
    ).rejects.toThrow("always fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("タイムアウト時は abort されて再試行する", async () => {
    let attempts = 0;
    const fn = async (signal: AbortSignal) => {
      attempts++;
      if (attempts < 2) {
        // 1 回目は signal.aborted を待つ（タイムアウト発火を模擬）
        return new Promise<string>((_, reject) => {
          signal.addEventListener("abort", () =>
            reject(
              new DOMException(
                signal.reason?.message ?? "aborted",
                "AbortError"
              )
            )
          );
        });
      }
      return "ok-on-retry";
    };
    const result = await withTimeoutRetry(fn, {
      timeoutMs: 30,
      maxAttempts: 3,
      retryBackoffMs: 1,
    });
    expect(result).toBe("ok-on-retry");
    expect(attempts).toBe(2);
  });

  it("外部 abort が既に立っているときは試行しない", async () => {
    const controller = new AbortController();
    controller.abort(new Error("user cancel"));
    const fn = vi.fn();
    await expect(
      withTimeoutRetry(fn, {
        timeoutMs: 100,
        maxAttempts: 3,
        externalSignal: controller.signal,
      })
    ).rejects.toThrow();
    expect(fn).not.toHaveBeenCalled();
  });

  it("実行中に外部 abort が立ったらリトライせず throw", async () => {
    const controller = new AbortController();
    const fn = vi.fn(async (signal: AbortSignal) => {
      // abort を受け取るまで待つ
      return new Promise<string>((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });
    const promise = withTimeoutRetry(fn, {
      timeoutMs: 10_000,
      maxAttempts: 3,
      retryBackoffMs: 1,
      externalSignal: controller.signal,
    });
    // 少し待ってから abort
    await new Promise((r) => setTimeout(r, 10));
    controller.abort(new Error("user cancel"));
    await expect(promise).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
