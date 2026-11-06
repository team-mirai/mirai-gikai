import "server-only";

import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { env } from "@/lib/env";
import type { OpenDataOpenInterviewsResult } from "../../shared/types/open-data-open-interviews";
import { toOpenDataOpenInterviewItem } from "../../shared/utils/to-open-data-open-interview";
import { findOpenDataOpenInterviewConfigs } from "../repositories/open-data-repository";

/**
 * 公開データAPI用の受付中インタビュー一覧を取得する。
 * 件数は公開中の議案数を超えないため、ページングはしない。
 */
export async function getOpenDataOpenInterviews(params: {
  difficulty: DifficultyLevelEnum;
}): Promise<OpenDataOpenInterviewsResult> {
  const rows = await findOpenDataOpenInterviewConfigs(params);
  return {
    items: rows.map((row) => toOpenDataOpenInterviewItem(row, env.webUrl)),
  };
}
