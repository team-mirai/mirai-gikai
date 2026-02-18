import { getBillsByFeaturedTags } from "@/features/bills/server/loaders/get-bills-by-featured-tags";
import { getComingSoonBills } from "./get-coming-soon-bills";
import { getFeaturedBills } from "./get-featured-bills";
import { getPreviousSessionBills } from "./get-previous-session-bills";

/**
 * トップページ用のデータを並列取得する
 * BFF (Backend For Frontend) パターン
 */
export async function loadHomeData() {
  const [featuredBills, billsByTag, comingSoonBills, previousSessionData] =
    await Promise.all([
      getFeaturedBills(),
      getBillsByFeaturedTags(),
      getComingSoonBills(),
      getPreviousSessionBills(),
    ]);

  return {
    billsByTag,
    featuredBills,
    comingSoonBills,
    previousSessionData,
  };
}
