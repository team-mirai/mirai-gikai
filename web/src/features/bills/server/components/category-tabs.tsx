import "server-only";

import type { Route } from "next";
import Link from "next/link";
import type { BillsByTag } from "../../shared/types";
import { billsListHref } from "../../shared/utils/parse-bills-list-params";

/**
 * トップページのカテゴリタブ。
 *
 * トップに全法案は載せられないので、カテゴリから一覧へ入る導線を先頭に置く。
 * 各タブは `/bills` をタグで絞った状態にリンクする。
 *
 * 件数は出さない。ここのタグは注目タグに限られ、集計も会期と難易度で
 * 絞られているため、`/bills` 側の全公開議案からの件数と一致しない。
 */
export function CategoryTabs({ billsByTag }: { billsByTag: BillsByTag[] }) {
  const tabs = billsByTag.filter(({ bills }) => bills.length > 0);
  if (tabs.length === 0) return null;

  return (
    <nav aria-label="カテゴリ" className="scrollbar-hide overflow-x-auto">
      <div className="flex w-max items-center gap-1.5">
        {tabs.map(({ tag }) => (
          <Tab
            key={tag.id}
            href={billsListHref(DEFAULT_LIST_PARAMS, { tagId: tag.id })}
            label={tag.label}
          />
        ))}
      </div>
    </nav>
  );
}

function Tab({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-full border border-mirai-border bg-white px-3.5 py-1.5 text-[13px] font-bold text-mirai-text"
    >
      {label}
    </Link>
  );
}

/** 一覧の既定状態。タグだけを差し替えてリンクを作る。 */
const DEFAULT_LIST_PARAMS = {
  query: "",
  status: "all",
  tagId: null,
  sort: "new",
  interviewOnly: false,
} as const;
