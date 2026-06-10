import { findPublishedAnalysis } from "@/features/user-topic-analysis/server/repositories/topic-analysis-read-repository";
import { buildPublicTopicAnalysis } from "@/features/user-topic-analysis/shared/utils/build-public-topic-analysis";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // 同意撤回・非公開化が即座に反映されるよう（§8）キャッシュしない。
      "Cache-Control": "no-store",
    },
  });

/**
 * ユーザー向けトピック分析の公開読み取り API（§13 A.4）。
 * 公開中（is_published=true）version のトピック＋意見を、§8 の表示時フィルタ適用後で返す。
 * 公開版が無ければ 404（UI 側は「分析準備中」表示にする）。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ billId: string }> }
) {
  const { billId } = await params;
  if (!billId) {
    return json({ error: "billId is required" }, 400);
  }

  try {
    const data = await findPublishedAnalysis(billId);
    if (!data) {
      return json({ error: "no published analysis" }, 404);
    }
    return json(buildPublicTopicAnalysis(data.meta, data.rawTopics));
  } catch (error) {
    console.error("[TopicAnalysis] public read failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "read failed" },
      500
    );
  }
}
