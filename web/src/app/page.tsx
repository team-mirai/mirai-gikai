import { Container } from "@/components/layouts/container";
import { About } from "@/components/top/about";
import { ComingSoonSection } from "@/components/top/coming-soon-section";
import { Hero } from "@/components/top/hero";
import { TeamMirai } from "@/components/top/team-mirai";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillsByTagSection } from "@/features/bills/server/components/bills-by-tag-section";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { PreviousSessionSection } from "@/features/bills/server/components/previous-session-section";
import { loadHomeData } from "@/features/bills/server/loaders/load-home-data";
import type { BillWithContent } from "@/features/bills/shared/types";
import { HomeChatClient } from "@/features/chat/client/components/home-chat-client";
import { getCurrentDietSession } from "@/features/diet-sessions/server/loaders/get-current-diet-session";
import { CurrentDietSession } from "@/features/diet-sessions/client/components/current-diet-session";
import { getJapanTime } from "@/lib/utils/date";

export default async function Home() {
  const { billsByTag, featuredBills, comingSoonBills, previousSessionData } =
    await loadHomeData();

  // ゆくゆくタグ機能がマージされたらBFFに統合する
  const [currentSession, currentDifficulty] = await Promise.all([
    getCurrentDietSession(getJapanTime()),
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
      <Hero />

      {/* 本日の国会セクション */}
      <CurrentDietSession session={currentSession} />

      {/* 議案一覧セクション */}
      <Container className="pb-20">
        <div className="py-8">
          <main className="flex flex-col gap-16">
            {/* 注目の法案セクション */}
            <FeaturedBillSection bills={featuredBills} />

            {/* タグ別議案一覧セクション */}
            <BillsByTagSection billsByTag={billsByTag} />

            {/* Coming soonセクション */}
            <ComingSoonSection bills={comingSoonBills} />
          </main>
        </div>

        {/* 前回の国会セクション（Archive） */}
        {previousSessionData && (
          <div className="bg-[#E5E5EA] -mx-4 sm:-mx-6 px-4 sm:px-6 py-9">
            <PreviousSessionSection
              session={previousSessionData.session}
              bills={previousSessionData.bills}
            />
          </div>
        )}

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
