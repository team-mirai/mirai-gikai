/**
 * LLM 呼び出し用のタイムアウト + リトライラッパ。
 *
 * - 各試行に独立したタイムアウトシグナルを与え、超過時は AbortError で打ち切り
 * - ユーザーからの外部 abort（externalSignal）は即座に伝播し、リトライしない
 * - タイムアウトや transient エラーは maxAttempts 回まで再試行
 *
 * `AbortSignal.any` を避け、AbortController で合成することで Node 18 以上で動く。
 */

export interface WithTimeoutRetryOptions {
  /** クライアント abort 用の外部シグナル（全体中断）。任意 */
  externalSignal?: AbortSignal;
  /** 1 試行あたりの最大待ち時間 (ms) */
  timeoutMs: number;
  /** 総試行回数。1 ならリトライなし。既定は 2（= 1 回リトライ） */
  maxAttempts?: number;
  /** リトライ前の待機 ms。attempt 回数を掛けて線形バックオフする。既定 500 */
  retryBackoffMs?: number;
  /** ログ出力用ラベル */
  label?: string;
}

function combineAbortSignals(signals: AbortSignal[]): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  // 1 件だけならそのまま
  if (signals.length === 1) {
    return { signal: signals[0], cleanup: () => {} };
  }
  const controller = new AbortController();
  const listeners: Array<() => void> = [];
  const onAbort = (reason: unknown) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  for (const s of signals) {
    if (s.aborted) {
      onAbort(s.reason);
      break;
    }
    const listener = () => onAbort(s.reason);
    s.addEventListener("abort", listener, { once: true });
    listeners.push(() => s.removeEventListener("abort", listener));
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      for (const off of listeners) off();
    },
  };
}

/**
 * fn を timeoutMs ごとに最大 maxAttempts 回実行する。
 * fn には「この試行用に合成された AbortSignal」が渡されるので、
 * `generateObject({ abortSignal: signal })` のように下流へ渡すこと。
 */
export async function withTimeoutRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: WithTimeoutRetryOptions
): Promise<T> {
  const {
    externalSignal,
    timeoutMs,
    maxAttempts = 2,
    retryBackoffMs = 500,
    label,
  } = options;

  let lastError: unknown = new Error(
    `${label ?? "LLM call"} failed: no attempts`
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // 外部 abort が既に立っていたら試行しない
    if (externalSignal?.aborted) {
      throw externalSignal.reason ?? new DOMException("Aborted", "AbortError");
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const { signal, cleanup } = combineAbortSignals(
      externalSignal ? [externalSignal, timeoutSignal] : [timeoutSignal]
    );

    try {
      return await fn(signal);
    } catch (error) {
      cleanup();
      lastError = error;

      // ユーザー操作による外部 abort → 即 throw（リトライしない）
      if (externalSignal?.aborted) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delay = retryBackoffMs * attempt;
        const reason = timeoutSignal.aborted
          ? `timeout(${timeoutMs}ms)`
          : "error";
        console.warn(
          `[${label ?? "LLM call"}] attempt ${attempt} failed (${reason}), retrying in ${delay}ms`,
          error
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      // 最終試行でも失敗 → そのまま throw
      throw error;
    } finally {
      cleanup();
    }
  }
  // 到達不能（for 内で return/throw する）
  throw lastError;
}
