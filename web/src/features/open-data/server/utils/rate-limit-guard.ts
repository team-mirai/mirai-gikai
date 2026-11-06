import "server-only";

import { jsonNoStore } from "@/lib/api/response";
import { getClientIp } from "../../shared/utils/client-ip";
import { toPositiveInt } from "../../shared/utils/parse-pagination-query";
import {
  getRetryAfterSeconds,
  getWindowStart,
} from "../../shared/utils/rate-limit-window";
import { consumeRateLimit } from "../repositories/open-data-repository";

const RATE_LIMIT_WINDOW_SECONDS = 60;

/**
 * オープンデータAPI共通のレートリミット（IP単位 + API全体、環境変数で
 * 上書き可能）を消費する。超過時は429レスポンスを、通過時は null を返す。
 *
 * - 制限値はモジュールロード時に固定せずリクエスト毎に env から読むことで、
 *   env変更の即時反映とテストの簡素化（動的import不要）を両立する
 * - IP制限を先に判定し、通過したリクエストだけがグローバル枠を消費する
 *   （超過IPの連投が全体枠を食い潰し、他クライアントを巻き込むのを防ぐ）
 */
export async function checkRateLimit(
  request: Request
): Promise<Response | null> {
  const perIpLimit = toPositiveInt(process.env.OPEN_DATA_RATE_LIMIT_PER_IP, 30);
  const globalLimit = toPositiveInt(
    process.env.OPEN_DATA_RATE_LIMIT_GLOBAL,
    300
  );

  const now = new Date();
  const windowStart = getWindowStart(
    now,
    RATE_LIMIT_WINDOW_SECONDS
  ).toISOString();
  const clientIp = getClientIp(request.headers) ?? "unknown";
  const tooManyRequests = () =>
    jsonNoStore(
      {
        error: "リクエストが多すぎます。しばらく待ってから再試行してください",
      },
      429,
      {
        "Retry-After": String(
          getRetryAfterSeconds(now, RATE_LIMIT_WINDOW_SECONDS)
        ),
      }
    );

  const ipAllowed = await consumeRateLimit({
    key: `open-data:ip:${clientIp}`,
    windowStart,
    limit: perIpLimit,
  });
  if (!ipAllowed) {
    return tooManyRequests();
  }

  const globalAllowed = await consumeRateLimit({
    key: "open-data:global",
    windowStart,
    limit: globalLimit,
  });
  if (!globalAllowed) {
    return tooManyRequests();
  }

  return null;
}
