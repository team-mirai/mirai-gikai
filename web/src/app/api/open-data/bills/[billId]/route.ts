import { getOpenDataBillDetail } from "@/features/open-data/server/services/get-open-data-bill-detail";
import { checkRateLimit } from "@/features/open-data/server/utils/rate-limit-guard";
import { parseDifficultyQuery } from "@/features/open-data/shared/utils/parse-bills-query";
import { isUuid } from "@/features/open-data/shared/utils/uuid";
import { jsonNoStore } from "@/lib/api/response";

/**
 * 議案詳細のオープンデータ取得API。
 *
 * - 公開中（publish_status = published）の議案のみを、本文解説・
 *   チームみらいの賛否・タグ付きで返す
 * - APIキーは発行せず、オープンデータAPI全体でレートリミットを設ける
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ billId: string }> }
) {
  const { billId } = await params;
  if (!isUuid(billId)) {
    return jsonNoStore({ error: "billId はUUID形式で指定してください" }, 400);
  }

  const url = new URL(request.url);
  const difficultyQuery = parseDifficultyQuery(url.searchParams);
  if (!difficultyQuery.ok) {
    return jsonNoStore({ error: difficultyQuery.error }, 400);
  }
  const { difficulty } = difficultyQuery;

  try {
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) {
      return rateLimited;
    }

    const bill = await getOpenDataBillDetail({ billId, difficulty });
    if (bill === null) {
      return jsonNoStore({ error: "指定された議案が見つかりません" }, 404);
    }
    return jsonNoStore(bill);
  } catch (error) {
    // 内部エラーの詳細（DBエラーメッセージ等）は公開APIのレスポンスに含めない
    console.error("[OpenData] bill detail read failed:", error);
    return jsonNoStore({ error: "サーバー内部でエラーが発生しました" }, 500);
  }
}
