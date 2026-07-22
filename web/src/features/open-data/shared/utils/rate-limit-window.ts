/**
 * 固定ウィンドウ方式のレートリミットで使うウィンドウ開始時刻を計算する。
 * 同一ウィンドウ内のリクエストは同じ開始時刻に丸められ、DB側カウンタのキーになる。
 */
export function getWindowStart(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/**
 * 現在のウィンドウが終わるまでの残り秒数（429レスポンスの Retry-After 用）。
 */
export function getRetryAfterSeconds(now: Date, windowSeconds: number): number {
  const windowEnd =
    getWindowStart(now, windowSeconds).getTime() + windowSeconds * 1000;
  return Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000));
}
