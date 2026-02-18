import Link from "next/link";
import type { BillWithContent } from "../../shared/types";
import { BillCard } from "../../client/components/bill-list/bill-card";

interface FeaturedBillSectionProps {
  bills: BillWithContent[];
}

export function FeaturedBillSection({ bills }: FeaturedBillSectionProps) {
  if (bills.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      {/* セクションヘッダー */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[22px] font-bold text-[#1F2937] leading-[1.48]">
          注目の法案🔥
        </h2>
        <p className="text-xs font-medium text-[#404040] leading-[1.67]">
          国会に提出された注目法案
        </p>
      </div>

      {/* 注目の議案カード */}
      <div className="flex flex-col gap-4">
        {bills.map((bill) => (
          <Link key={bill.id} href={`/bills/${bill.id}`}>
            <BillCard bill={bill} />
          </Link>
        ))}
      </div>
    </section>
  );
}
