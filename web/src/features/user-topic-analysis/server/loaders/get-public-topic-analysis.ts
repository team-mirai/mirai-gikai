import "server-only";

import type { PublicTopicAnalysis } from "../../shared/types";
import { buildPublicTopicAnalysis } from "../../shared/utils/build-public-topic-analysis";
import { findPublishedAnalysis } from "../repositories/topic-analysis-read-repository";

/**
 * 議案の公開中トピック分析を、§8 の表示時フィルタ適用後の表示用データで取得する。
 * Server Components から直接呼ぶ（公開 API と同じデータ契約）。
 * 公開版が無ければ null（呼び出し側で「分析準備中」扱いにする）。
 */
export async function getPublicTopicAnalysis(
  billId: string
): Promise<PublicTopicAnalysis | null> {
  const data = await findPublishedAnalysis(billId);
  if (!data) return null;
  return buildPublicTopicAnalysis(data.meta, data.rawTopics);
}
