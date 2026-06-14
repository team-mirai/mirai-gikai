import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { BillCard } from "../../client/components/bill-list/bill-card";
import type { BillWithContent } from "../../shared/types";

interface FeaturedBillSectionProps {
  bills: BillWithContent[];
  sessionSlug?: string;
}

export function FeaturedBillSection({
  bills,
  sessionSlug,
}: FeaturedBillSectionProps) {
  if (bills.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      {/* セクションヘッダー */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
          注目の議案
        </h2>
        <p className="text-xs font-medium text-mirai-text-secondary leading-[1.67]">
          草津市議会に提出された注目議案
        </p>
      </div>

      {/* 注目の議案カード */}
      <div className="flex flex-col gap-4">
        {bills.map((bill) => (
          <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
            <BillCard bill={bill} />
          </Link>
        ))}
      </div>

      {sessionSlug && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-12 w-full max-w-[320px] rounded-full border-mirai-text bg-white text-base font-bold hover:bg-gray-50"
          >
            <Link href={routes.kokkaiSessionBills(sessionSlug) as Route}>
              議案一覧を見る
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
