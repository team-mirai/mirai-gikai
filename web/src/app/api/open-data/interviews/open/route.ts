import { getOpenDataOpenInterviews } from "@/features/open-data/server/services/get-open-data-open-interviews";
import { checkRateLimit } from "@/features/open-data/server/utils/rate-limit-guard";
import { parseDifficultyQuery } from "@/features/open-data/shared/utils/parse-bills-query";
import { jsonNoStore } from "@/lib/api/response";

/**
 * 受付中のAIインタビュー一覧のオープンデータ取得API。
 *
 * - インタビューページを開ける（設定が公開中かつ議案が公開中の）インタビューだけを、
 *   議案のタイトル・概要・サムネイルと目安時間付きで新しい順に返す
 * - 外部サイトが「いま回答できるインタビュー」への導線を出すためのもので、
 *   回答データは含まない（そのため利用規約への同意は求めない）
 * - APIキーは発行せず、オープンデータAPI全体でレートリミットを設ける
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const query = parseDifficultyQuery(url.searchParams);
  if (!query.ok) {
    return jsonNoStore({ error: query.error }, 400);
  }

  try {
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) {
      return rateLimited;
    }

    const result = await getOpenDataOpenInterviews({
      difficulty: query.difficulty,
    });
    return jsonNoStore(result);
  } catch (error) {
    // 内部エラーの詳細（DBエラーメッセージ等）は公開APIのレスポンスに含めない
    console.error("[OpenData] open interviews read failed:", error);
    return jsonNoStore({ error: "サーバー内部でエラーが発生しました" }, 500);
  }
}
