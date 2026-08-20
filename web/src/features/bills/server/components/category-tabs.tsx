import "server-only";

import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { BillsByTag } from "../../shared/types";
import { billsListHref } from "../../shared/utils/parse-bills-list-params";
import { splitIntoRows } from "../../shared/utils/split-into-rows";

/**
 * トップページのカテゴリタブ。
 *
 * トップに全法案は載せられないので、カテゴリから一覧へ入る導線を先頭に置く。
 * 各タブは `/bills` をタグで絞った状態にリンクする。
 *
 * 件数はそのタグが持つ議案数で、トップに並ぶカードの枚数ではない。トップは
 * 各タグ2件までのピックアップなので、7件のタグでもカードは2枚になる。
 * `/bills` 側は全会期の公開議案を数えるため、遷移先の件数とも一致しない。
 *
 * 狭い画面では2行、広い画面では1行にする。同じ並びを2つの構造で出し分ける
 * のは、1行を折り返して2行にすると横スクロールが効かず、逆に2行を横に
 * つなげるとタブの並び順が入れ替わってしまうため。
 */
export function CategoryTabs({
  billsByTag,
  featuredAnchor,
}: {
  billsByTag: BillsByTag[];
  /** 注目セクションの id。閉会中はセクションが無いので渡さない。 */
  featuredAnchor?: string;
}) {
  const tabs = billsByTag.filter(({ bills }) => bills.length > 0);
  if (tabs.length === 0) return null;

  // 「注目」はページ内の注目セクションへ送る。一覧への絞り込みではない。
  const featured: TabItem | null = featuredAnchor
    ? { key: "featured", label: "注目", anchor: featuredAnchor }
    : null;
  const tagItems: TabItem[] = tabs.map(({ tag, bills }) => ({
    key: tag.id,
    label: tag.label,
    href: billsListHref(DEFAULT_LIST_PARAMS, { tagId: tag.id }),
    count: bills.length,
  }));
  // 2行のときも「注目」は先頭に置き、タグだけを行に振り分ける。
  const [firstRow, secondRow] = splitIntoRows(tagItems, 2);

  return (
    <nav aria-label="カテゴリ" className="scrollbar-hide overflow-x-auto">
      <div className="hidden w-max items-center gap-2 sm:flex">
        {featured && <TabChip item={featured} />}
        {tagItems.map((item) => (
          <TabChip key={item.key} item={item} />
        ))}
        {/* 右に続きがあることを示す。デザインどおりリンクではない。 */}
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black bg-white"
        >
          <ChevronRight
            className="h-4 w-4 text-primary-accent"
            strokeWidth={2.5}
          />
        </span>
      </div>

      <div className="flex w-max flex-col gap-1.5 sm:hidden">
        <div className="flex items-center gap-1.5">
          {featured && <TabChip item={featured} />}
          {firstRow.map((item) => (
            <TabChip key={item.key} item={item} />
          ))}
        </div>
        {secondRow.length > 0 && (
          <div className="flex items-center gap-1.5">
            {secondRow.map((item) => (
              <TabChip key={item.key} item={item} />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

type TabItem = {
  key: string;
  label: string;
  /** ページ内アンカー。タグのタブは持たない。 */
  anchor?: string;
  href?: Route;
  count?: number;
};

function TabChip({ item }: { item: TabItem }) {
  if (item.anchor) {
    return (
      <a
        href={`#${item.anchor}`}
        className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-black bg-mirai-brand-teal px-4 text-[13px] font-bold text-white"
      >
        {item.label}
      </a>
    );
  }

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-mirai-border bg-white px-3.5 text-[13px] font-bold text-mirai-text"
    >
      {item.label}
      <span className="font-lexend text-xs font-bold text-mirai-text-muted">
        {item.count}
      </span>
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
