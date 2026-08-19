import "server-only";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { BillsByTag } from "../../shared/types";

/**
 * トップページのカテゴリタブ。
 *
 * トップに全法案は載せられないので、カテゴリから一覧へ入る導線を先頭に置く。
 * 各タブは `/bills` をタグで絞った状態にリンクする。件数を添えるのは、
 * 押す前にどれだけ法案があるか分かるようにするため。
 */
export function CategoryTabs({
  billsByTag,
  featuredCount,
}: {
  billsByTag: BillsByTag[];
  featuredCount: number;
}) {
  const tabs = billsByTag.filter(({ bills }) => bills.length > 0);
  if (tabs.length === 0) return null;

  return (
    <nav aria-label="カテゴリ" className="scrollbar-hide overflow-x-auto">
      <div className="flex w-max items-center gap-1.5">
        {featuredCount > 0 && (
          <Tab href={routes.billsList()} label="注目" count={featuredCount} />
        )}
        {tabs.map(({ tag, bills }) => (
          <Tab
            key={tag.id}
            href={`${routes.billsList()}?tag=${encodeURIComponent(tag.id)}`}
            label={tag.label}
            count={bills.length}
          />
        ))}
        <Link
          href={routes.billsList()}
          aria-label="すべての法案を見る"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-mirai-border bg-white"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-mirai-border bg-white px-3.5 py-1.5 text-[13px] font-bold text-mirai-text"
    >
      {label}
      <span className="text-mirai-text-muted">{count}</span>
    </Link>
  );
}
