import Link from "next/link";
import type { BillsByTag } from "../../shared/types";
import { BillCard } from "../../client/components/bill-list/bill-card";

interface BillsByTagSectionProps {
  billsByTag: BillsByTag[];
}

export function BillsByTagSection({ billsByTag }: BillsByTagSectionProps) {
  if (billsByTag.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {billsByTag.map(({ tag, bills }) => (
        <section key={tag.id} className="flex flex-col gap-6">
          {/* タグヘッダー */}
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[22px] font-bold text-black leading-[1.48]">
              {tag.label}
            </h2>
            {tag.description && (
              <p className="text-xs text-[#404040]">{tag.description}</p>
            )}
          </div>

          {/* 議案カード一覧 */}
          <div className="flex flex-col gap-4">
            {bills.map((bill) => (
              <Link key={bill.id} href={`/bills/${bill.id}`}>
                <BillCard bill={bill} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
