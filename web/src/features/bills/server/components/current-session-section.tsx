import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import { routes } from "@/lib/routes";
import { CompactBillCard } from "../../client/components/bill-list/compact-bill-card";
import type { BillWithContent } from "../../shared/types";

interface CurrentSessionSectionProps {
  session: DietSession;
  bills: BillWithContent[];
}

const VISIBLE_BILLS = 5;

export function CurrentSessionSection({
  session,
  bills,
}: CurrentSessionSectionProps) {
  if (!session.slug || bills.length === 0) {
    return null;
  }

  const sessionBillsUrl = routes.kokkaiSessionBills(session.slug);
  const visibleBills = bills.slice(0, VISIBLE_BILLS);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
          現在の会期の議案
        </h2>
        <p className="text-xs font-medium text-mirai-text-secondary leading-[1.67]">
          {session.name}に提出された議案 {bills.length}件
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {visibleBills.map((bill) => (
          <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
            <CompactBillCard bill={bill} />
          </Link>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          asChild
          className="h-12 w-full max-w-[320px] rounded-full border-mirai-text bg-white text-base font-bold hover:bg-gray-50"
        >
          <Link href={sessionBillsUrl as Route}>
            {session.name}の議案をすべて見る
          </Link>
        </Button>
      </div>
    </section>
  );
}
