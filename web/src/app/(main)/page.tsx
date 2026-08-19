import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { About } from "@/components/top/about";
import { ComingSoonSection } from "@/components/top/coming-soon-section";
import { TeamMirai } from "@/components/top/team-mirai";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillsByTagSection } from "@/features/bills/server/components/bills-by-tag-section";
import { CategoryTabs } from "@/features/bills/server/components/category-tabs";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { PreviousSessionSection } from "@/features/bills/server/components/previous-session-section";
import { loadHomeData } from "@/features/bills/server/loaders/load-home-data";
import type { BillWithContent } from "@/features/bills/shared/types";
import { HomeChatClient } from "@/features/chat/client/components/home-chat-client";
import { CurrentDietSession } from "@/features/diet-sessions/client/components/current-diet-session";
import { getCurrentDietSession } from "@/features/diet-sessions/server/loaders/get-current-diet-session";
import { routes } from "@/lib/routes";
import { getJapanTime } from "@/lib/utils/date";

/** トップのタグ別一覧に出す1タグあたりの件数。全件は /bills で見せる。 */
const BILLS_PER_TAG_ON_TOP = 2;

export default async function Home() {
  const japanTime = getJapanTime();
  const { billsByTag, featuredBills, comingSoonBills, previousSessionData } =
    await loadHomeData();

  // ゆくゆくタグ機能がマージされたらBFFに統合する
  const [currentSession, currentDifficulty] = await Promise.all([
    getCurrentDietSession(japanTime),
    getDifficultyLevel(),
  ]);

  const toBillChatContext = (bill: BillWithContent) => {
    return {
      name: `${bill.bill_content?.title}（${bill.name}）`,
      summary: bill.bill_content?.summary,
      tags: bill.tags?.map((tag) => tag.label) || [],
      isFeatured: featuredBills.some((b) => b.id === bill.id),
    };
  };

  return (
    <>
      {/* 本日の国会セクション */}
      <CurrentDietSession
        session={currentSession}
        previousSession={previousSessionData?.session ?? null}
        now={japanTime}
      />

      <Container>
        <div className="pt-4">
          <CategoryTabs
            billsByTag={billsByTag}
            featuredCount={featuredBills.length}
          />
        </div>
      </Container>

      {/* 全件を探す導線。トップはピックアップに留める */}
      <Container>
        <div className="flex justify-end pt-2">
          <Link
            href={routes.billsList()}
            className="inline-flex items-center gap-1 text-[13px] font-bold text-mirai-brand-teal-hover hover:underline"
          >
            <Search className="h-4 w-4" aria-hidden />
            法案を検索する
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Container>

      {/* 議案一覧セクション */}
      <Container className="">
        <div className="py-10">
          <main className="flex flex-col gap-16">
            {/*
              注目の法案は閉会中は出さない。審議が動いていない時期に
              「注目」を掲げても、更新されていない情報に見える。
            */}
            {currentSession !== null && (
              <FeaturedBillSection bills={featuredBills} />
            )}

            {/* タグ別議案一覧セクション（トップはピックアップなので各2件） */}
            <BillsByTagSection
              billsByTag={billsByTag.map((group) => ({
                ...group,
                bills: group.bills.slice(0, BILLS_PER_TAG_ON_TOP),
              }))}
            />

            {/* Coming soonセクション */}
            <ComingSoonSection bills={comingSoonBills} />
          </main>
        </div>
      </Container>

      {/* 前回の国会セクション（Archive） */}
      {previousSessionData && (
        <div className="bg-mirai-surface-muted py-10">
          <Container>
            <PreviousSessionSection
              session={previousSessionData.session}
              bills={previousSessionData.bills}
              totalBillCount={previousSessionData.totalBillCount}
            />
          </Container>
        </div>
      )}

      <Container>
        {/* みらい議会とは セクション */}
        <About />

        {/* チームみらいについて セクション */}
        <TeamMirai />

        {/* 免責事項 */}
        <BillDisclaimer />
      </Container>

      {/* チャット機能 */}
      <HomeChatClient
        currentDifficulty={currentDifficulty}
        bills={billsByTag
          .flatMap((x) => x.bills)
          .concat(featuredBills)
          .map(toBillChatContext)}
      />
    </>
  );
}
