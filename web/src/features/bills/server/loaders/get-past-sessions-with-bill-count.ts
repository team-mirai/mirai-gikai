import "server-only";

import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { getPastDietSessions } from "@/features/diet-sessions/server/loaders/get-past-diet-sessions";
import type { SluggedDietSession } from "@/features/diet-sessions/shared/types";
import { getPublishedBillCount } from "./get-published-bill-count";

export type PastSessionWithBillCount = {
  session: SluggedDietSession;
  billCount: number;
};

/**
 * 過去の会期と、各会期の公開議案数を取得する。
 * 前回の国会セクションに出す直近の会期も、一覧の先頭に含める（デザイン通り）。
 * 公開議案が0件の会期はリンク先が空になるため除外する。
 */
export async function getPastSessionsWithBillCount(): Promise<
  PastSessionWithBillCount[]
> {
  const [sessions, difficultyLevel] = await Promise.all([
    getPastDietSessions(),
    getDifficultyLevel(),
  ]);
  const counts = await Promise.all(
    sessions.map((session) =>
      getPublishedBillCount(session.id, difficultyLevel)
    )
  );

  return sessions
    .map((session, i) => ({ session, billCount: counts[i] }))
    .filter(({ billCount }) => billCount > 0);
}
