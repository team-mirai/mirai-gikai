import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { BillWithContent } from "../../../shared/types";
import { BillCard } from "./bill-card";
import { CompactBillCard } from "./compact-bill-card";

interface BillCardListProps {
  bills: BillWithContent[];
}

/**
 * トップのセクション内に並べる議案カード一覧。
 *
 * 先頭だけフルカードで、2件目以降はコンパクトにする。1セクションに同じ大きさの
 * カードを並べると縦に伸びて、次のセクションまでスクロールが遠くなる。
 */
export function BillCardList({ bills }: BillCardListProps) {
  return (
    <div className="flex flex-col gap-4">
      {bills.map((bill, index) => (
        <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
          {index === 0 ? (
            <BillCard bill={bill} />
          ) : (
            <CompactBillCard bill={bill} />
          )}
        </Link>
      ))}
    </div>
  );
}
