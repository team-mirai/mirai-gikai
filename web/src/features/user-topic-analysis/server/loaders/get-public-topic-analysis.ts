import "server-only";

import {
  getPublicTopicAnalysis as fetchPublicTopicAnalysis,
  type PublicTopicAnalysis,
} from "@mirai-gikai/topic-analysis-core/public-server";
import { cache } from "react";

/**
 * 議案の公開中トピック分析を、§8 の表示時フィルタ適用後の表示用データで取得する。
 * Server Components から直接呼ぶ（公開 API と同じデータ契約）。
 * 公開版が無ければ null（呼び出し側で「分析準備中」扱いにする）。
 *
 * 取得・フィルタの本体は @mirai-gikai/topic-analysis-core/public に集約（web/admin 共有）。
 * React cache() でリクエスト内のDB呼び出しを重複排除する
 * （generateMetadata とページ本体で同じ billId を取得しても1回のクエリで済む）。
 */
export const getPublicTopicAnalysis = cache(
  (billId: string): Promise<PublicTopicAnalysis | null> =>
    fetchPublicTopicAnalysis(billId)
);
