import type { DietSession } from "../types";

/** 会期の進行状況。会期中のプログレスバー表示に使う。 */
export type SessionProgress = {
  /** 進行率（0〜100の整数）。 */
  percentage: number;
  /** 閉会までの残り日数。当日と過ぎている場合は0。 */
  daysLeft: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 会期の進行率と残り日数を求める純粋関数。
 *
 * 単なるパーセンテージだけを出すと寄付の目標額のように読まれるため、画面では
 * 残り日数と閉会予定日を併記する。ここでは両方をまとめて返す。
 *
 * 日付は日単位で切り、時刻は見ない。会期の召集・閉会は日付で告知されるので、
 * 実行時刻によって残り日数が揺れる方が実態に合わない。
 */
export function calculateSessionProgress(
  session: Pick<DietSession, "start_date" | "end_date">,
  now: Date
): SessionProgress {
  const start = toDayStart(session.start_date);
  const end = toDayStart(session.end_date);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const total = end - start;
  // 開始日と終了日が同日の会期でも0除算にしない。
  if (total <= 0) {
    return { percentage: today >= end ? 100 : 0, daysLeft: 0 };
  }

  const elapsed = today - start;
  const percentage = Math.min(
    100,
    Math.max(0, Math.round((elapsed / total) * 100))
  );
  const daysLeft = Math.max(0, Math.round((end - today) / MS_PER_DAY));

  return { percentage, daysLeft };
}

/** `YYYY-MM-DD` をUTCの日付境界に落とす。タイムゾーンで日がずれないようにする。 */
function toDayStart(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}
