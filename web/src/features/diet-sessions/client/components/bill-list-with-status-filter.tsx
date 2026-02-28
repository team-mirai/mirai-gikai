"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { BillWithContent } from "@/features/bills/shared/types";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";

type FilterType = "all" | "enacted" | "rejected" | "other";

type Props = {
  bills: BillWithContent[];
};

function getFilterCounts(bills: BillWithContent[]) {
  const enacted = bills.filter((b) => b.status === "enacted").length;
  const rejected = bills.filter((b) => b.status === "rejected").length;
  const other = bills.length - enacted - rejected;

  return { all: bills.length, enacted, rejected, other };
}

function filterBills(
  bills: BillWithContent[],
  filter: FilterType
): BillWithContent[] {
  switch (filter) {
    case "enacted":
      return bills.filter((b) => b.status === "enacted");
    case "rejected":
      return bills.filter((b) => b.status === "rejected");
    case "other":
      return bills.filter(
        (b) => b.status !== "enacted" && b.status !== "rejected"
      );
    default:
      return bills;
  }
}

export function BillListWithStatusFilter({ bills }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const counts = getFilterCounts(bills);
  const filteredBills = filterBills(bills, activeFilter);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "ALL", count: counts.all },
    { key: "enacted", label: "成立", count: counts.enacted },
    { key: "rejected", label: "否決", count: counts.rejected },
    { key: "other", label: "その他", count: counts.other },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* フィルターボタン */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant="ghost"
            onClick={() => setActiveFilter(filter.key)}
            className={`h-[29px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              activeFilter === filter.key
                ? "bg-mirai-gradient text-black hover:bg-mirai-gradient"
                : "bg-mirai-surface-grouped text-mirai-text-muted hover:bg-mirai-surface-muted"
            }`}
          >
            {filter.label} {filter.count}
          </Button>
        ))}
      </div>

      {/* 法案リスト */}
      {filteredBills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          該当する法案がありません
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBills.map((bill) => (
            <Link key={bill.id} href={`/bills/${bill.id}`}>
              <CompactBillCard bill={bill} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
