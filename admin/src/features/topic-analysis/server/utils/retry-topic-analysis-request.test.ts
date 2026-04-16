import { describe, expect, it, vi } from "vitest";
import {
  getRetryDelayMs,
  retryTopicAnalysisRequest,
} from "./retry-topic-analysis-request";

describe("getRetryDelayMs", () => {
  it("指数バックオフと jitter を加算する", () => {
    expect(getRetryDelayMs(1, 500, () => 0.5)).toBe(750);
    expect(getRetryDelayMs(2, 500, () => 0.2)).toBe(1100);
  });
});

describe("retryTopicAnalysisRequest", () => {
  it("リトライ可能なエラーでは成功するまで再試行する", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ statusCode: 429 })
      .mockResolvedValueOnce("ok");
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      retryTopicAnalysisRequest(fn, { label: "step1" }, { sleepFn })
    ).resolves.toBe("ok");

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("status=429"));
    warnSpy.mockRestore();
  });

  it("リトライ不可エラーは即座に失敗する", async () => {
    const error = new Error("schema mismatch");
    const fn = vi.fn().mockRejectedValue(error);
    const sleepFn = vi.fn().mockResolvedValue(undefined);

    await expect(
      retryTopicAnalysisRequest(fn, { label: "step3" }, { sleepFn })
    ).rejects.toThrow("schema mismatch");

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleepFn).not.toHaveBeenCalled();
  });

  it("最大試行回数で失敗を返す", async () => {
    const error = { response: { status: 503 } };
    const fn = vi.fn().mockRejectedValue(error);
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      retryTopicAnalysisRequest(
        fn,
        { label: "step3", maxAttempts: 3 },
        { sleepFn }
      )
    ).rejects.toEqual(error);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("status=503"));
    warnSpy.mockRestore();
  });

  it("不正な maxAttempts を明示エラーにする", async () => {
    await expect(
      retryTopicAnalysisRequest(
        vi.fn().mockResolvedValue("ok"),
        {
          label: "step1",
          maxAttempts: 0,
        },
        { sleepFn: vi.fn().mockResolvedValue(undefined) }
      )
    ).rejects.toThrow("maxAttempts must be greater than or equal to 1");
  });

  it("不正な baseDelayMs を明示エラーにする", async () => {
    await expect(
      retryTopicAnalysisRequest(
        vi.fn().mockResolvedValue("ok"),
        {
          label: "step1",
          baseDelayMs: -1,
        },
        { sleepFn: vi.fn().mockResolvedValue(undefined) }
      )
    ).rejects.toThrow("baseDelayMs must be greater than or equal to 0");
  });
});
