import { consumeRateLimit } from "@/features/open-data/server/repositories/open-data-repository";
import { getOpenDataInterviews } from "@/features/open-data/server/services/get-open-data-interviews";
import { getClientIp } from "@/features/open-data/shared/utils/client-ip";
import {
  parseInterviewsQuery,
  toPositiveInt,
} from "@/features/open-data/shared/utils/parse-interviews-query";
import {
  getRetryAfterSeconds,
  getWindowStart,
} from "@/features/open-data/shared/utils/rate-limit-window";
import { NextResponse } from "next/server";
import { routes } from "@/lib/routes";

const LICENSE = "CC BY 4.0";
const RATE_LIMIT_WINDOW_SECONDS = 60;

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  NextResponse.json(body, {
    status,
    headers: {
      // 同意撤回・非公開化が即座に反映されるようキャッシュしない
      "Cache-Control": "no-store",
      ...headers,
    },
  });

/**
 * AIインタビューデータのオープンデータ取得API。
 *
 * - 「みらい議会AIインタビューデータ利用規約」への同意表明
 *   （agreeToTerms=true）を必須とする
 * - 回答者が二次利用を許諾し（is_data_reuse_consented）、公開条件
 *   （管理者公開 × ユーザー公開 × 公開議案 × k-匿名性ゲート）を満たす
 *   レポートのみを返す
 * - APIキーは発行せず、API全体でレートリミットを設ける
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const termsUrl = new URL(routes.interviewDataTerms(), url.origin).toString();

  // 規約同意の表明（クリックスルー相当）を必須にする
  if (url.searchParams.get("agreeToTerms") !== "true") {
    return json(
      {
        error:
          "みらい議会AIインタビューデータ利用規約に同意の上、agreeToTerms=true を指定してください",
        termsUrl,
      },
      403
    );
  }

  const query = parseInterviewsQuery(url.searchParams);
  if (!query.ok) {
    return json({ error: query.error }, 400);
  }
  const { limit, cursor } = query;

  try {
    // レートリミット（IP単位 + API全体、環境変数で上書き可能）。
    // モジュールロード時に固定せずリクエスト毎に読むことで、env変更の即時反映と
    // テストの簡素化（動的import不要）を両立する
    const perIpLimit = toPositiveInt(
      process.env.OPEN_DATA_RATE_LIMIT_PER_IP,
      30
    );
    const globalLimit = toPositiveInt(
      process.env.OPEN_DATA_RATE_LIMIT_GLOBAL,
      300
    );
    // IP制限を先に判定し、通過したリクエストだけがグローバル枠を消費する
    // （超過IPの連投が全体枠を食い潰し、他クライアントを巻き込むのを防ぐ）
    const now = new Date();
    const windowStart = getWindowStart(
      now,
      RATE_LIMIT_WINDOW_SECONDS
    ).toISOString();
    const clientIp = getClientIp(request.headers) ?? "unknown";
    const tooManyRequests = () =>
      json(
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

    const result = await getOpenDataInterviews({ limit, cursor });
    return json({ ...result, license: LICENSE, termsUrl });
  } catch (error) {
    // 内部エラーの詳細（DBエラーメッセージ等）は公開APIのレスポンスに含めない
    console.error("[OpenData] interviews read failed:", error);
    return json({ error: "サーバー内部でエラーが発生しました" }, 500);
  }
}
