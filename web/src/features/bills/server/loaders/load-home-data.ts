import { getBillsByFeaturedTags } from "@/features/bills/server/loaders/get-bills-by-featured-tags";
import { getComingSoonBills } from "./get-coming-soon-bills";
import { getFeaturedBills } from "./get-featured-bills";
import { getInterviewOpenBills } from "./get-interview-open-bills";
import { getPastSessionsWithBillCount } from "./get-past-sessions-with-bill-count";
import { getPreviousSessionBills } from "./get-previous-session-bills";

/**
 * トップページ用のデータを並列取得する
 * BFF (Backend For Frontend) パターン
 */
export async function loadHomeData() {
  const [
    featuredBills,
    billsByTag,
    interviewOpenBills,
    comingSoonBills,
    previousSessionData,
    pastSessions,
  ] = await Promise.all([
    getFeaturedBills(),
    getBillsByFeaturedTags(),
    getInterviewOpenBills(),
    getComingSoonBills(),
    getPreviousSessionBills(),
    getPastSessionsWithBillCount(),
  ]);

  return {
    billsByTag,
    featuredBills,
    interviewOpenBills,
    comingSoonBills,
    previousSessionData,
    pastSessions,
  };
}
