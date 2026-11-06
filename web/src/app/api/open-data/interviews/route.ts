import { getOpenDataInterviews } from "@/features/open-data/server/services/get-open-data-interviews";
import { checkRateLimit } from "@/features/open-data/server/utils/rate-limit-guard";
import { parsePaginationQuery } from "@/features/open-data/shared/utils/parse-pagination-query";
import { jsonNoStore } from "@/lib/api/response";
import { routes } from "@/lib/routes";

const LICENSE = "CC BY 4.0";

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
    return jsonNoStore(
      {
        error:
          "みらい議会AIインタビューデータ利用規約に同意の上、agreeToTerms=true を指定してください",
        termsUrl,
      },
      403
    );
  }

  const query = parsePaginationQuery(url.searchParams);
  if (!query.ok) {
    return jsonNoStore({ error: query.error }, 400);
  }
  const { limit, cursor } = query;

  try {
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) {
      return rateLimited;
    }

    const result = await getOpenDataInterviews({ limit, cursor });
    return jsonNoStore({ ...result, license: LICENSE, termsUrl });
  } catch (error) {
    // 内部エラーの詳細（DBエラーメッセージ等）は公開APIのレスポンスに含めない
    console.error("[OpenData] interviews read failed:", error);
    return jsonNoStore({ error: "サーバー内部でエラーが発生しました" }, 500);
  }
}
