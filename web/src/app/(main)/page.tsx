import { Container } from "@/components/layouts/container";
import { About } from "@/components/top/about";
import { ComingSoonSection } from "@/components/top/coming-soon-section";
import { Hero } from "@/components/top/hero";
import { TeamMirai } from "@/components/top/team-mirai";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillsByTagSection } from "@/features/bills/server/components/bills-by-tag-section";
import { CurrentSessionSection } from "@/features/bills/server/components/current-session-section";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { PreviousSessionSection } from "@/features/bills/server/components/previous-session-section";
import { getBillsByDietSession } from "@/features/bills/server/loaders/get-bills-by-diet-session";
import { loadHomeData } from "@/features/bills/server/loaders/load-home-data";
import { CurrentDietSession } from "@/features/diet-sessions/client/components/current-diet-session";
import { getActiveDietSession } from "@/features/diet-sessions/server/loaders/get-active-diet-session";
import { getCurrentDietSession } from "@/features/diet-sessions/server/loaders/get-current-diet-session";
import { getJapanTime } from "@/lib/utils/date";

export default async function Home() {
  const { billsByTag, featuredBills, comingSoonBills, previousSessionData } =
    await loadHomeData();

  // ゆくゆくタグ機能がマージされたらBFFに統合する
  const [currentSession, activeSession] = await Promise.all([
    getCurrentDietSession(getJapanTime()),
    getActiveDietSession(),
  ]);
  const sessionSlug =
    activeSession?.slug ??
    currentSession?.slug ??
    previousSessionData?.session.slug ??
    undefined;
  const displaySession = activeSession ?? currentSession;
  const currentSessionBills = displaySession
    ? await getBillsByDietSession(displaySession.id)
    : [];

  return (
    <>
      <Hero />

      {/* 現在の会期 */}
      <CurrentDietSession session={currentSession} />

      {/* 議案一覧セクション */}
      <Container className="">
        <div className="py-10">
          <main className="flex flex-col gap-16">
            {displaySession && (
              <CurrentSessionSection
                session={displaySession}
                bills={currentSessionBills}
              />
            )}

            {/* 注目の議案セクション */}
            <FeaturedBillSection
              bills={featuredBills}
              sessionSlug={sessionSlug}
            />

            {/* タグ別議案一覧セクション */}
            <BillsByTagSection billsByTag={billsByTag} />

            {/* Coming soonセクション */}
            <ComingSoonSection bills={comingSoonBills} />
          </main>
        </div>
      </Container>

      {/* 前回の会期（Archive） */}
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

        {/* 運営者について */}
        <TeamMirai />

        {/* 免責事項 */}
        <BillDisclaimer />
      </Container>
    </>
  );
}
