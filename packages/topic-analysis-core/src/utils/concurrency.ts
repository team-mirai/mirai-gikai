/** 配列を size ごとのチャンクに分割する。size<=0 は不正なので例外にする（無限ループ防止）。 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error(`chunk: size must be greater than 0 (got ${size})`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/** items を最大 maxConcurrency 並列で処理し、入力順の結果配列を返す。 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  maxConcurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  // maxConcurrency<=0 でも最低1並列は確保する（worker 0個で永久に未完了になるのを防ぐ）。
  const workerCount = Math.min(Math.max(1, maxConcurrency), items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

function isRetryable(error: unknown): boolean {
  const status =
    typeof error === "object" && error !== null && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
  if (typeof status === "number") return status === 429 || status >= 500;
  if (!(error instanceof Error)) return false;
  const m = error.message.toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("timeout") ||
    m.includes("overloaded") ||
    m.includes("temporarily unavailable")
  );
}

/** リトライ可能なエラー（429/5xx/レート制限）に対して指数バックオフで再試行する。 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt === maxAttempts) throw error;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(
        `[topic-analysis] ${label} attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`[topic-analysis] ${label} exhausted retries`);
}
