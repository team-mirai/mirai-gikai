import { getOpenDataBills } from "@/features/open-data/server/services/get-open-data-bills";
import { checkRateLimit } from "@/features/open-data/server/utils/rate-limit-guard";
import { parseBillsQuery } from "@/features/open-data/shared/utils/parse-bills-query";
import { jsonNoStore } from "@/lib/api/response";

/**
 * 公開中の議案一覧のオープンデータ取得API。
 *
 * - 公開中（publish_status = published）の議案のみを、難易度別コンテンツ・
 *   チームみらいの賛否・タグ付きで新しい順に返す
 * - APIキーは発行せず、オープンデータAPI全体でレートリミットを設ける
 * - インタビューAPIと異なり license / termsUrl は返さない（インタビュー
 *   データ利用規約はインタビューデータ専用のため意図的に含めていない）
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const query = parseBillsQuery(url.searchParams);
  if (!query.ok) {
    return jsonNoStore({ error: query.error }, 400);
  }
  const { limit, cursor, difficulty } = query;

  try {
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) {
      return rateLimited;
    }

    const result = await getOpenDataBills({ limit, cursor, difficulty });
    return jsonNoStore(result);
  } catch (error) {
    // 内部エラーの詳細（DBエラーメッセージ等）は公開APIのレスポンスに含めない
    console.error("[OpenData] bills read failed:", error);
    return jsonNoStore({ error: "サーバー内部でエラーが発生しました" }, 500);
  }
}
