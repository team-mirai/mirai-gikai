import "server-only";

import { TagChipLink } from "../../client/components/bill-list/tag-chip-link";
import { CategoryTabScroller } from "../../client/components/category-tab-scroller";
import type { BillsByTag } from "../../shared/types";
import {
  billsListHref,
  DEFAULT_BILLS_LIST_PARAMS,
} from "../../shared/utils/parse-bills-list-params";
import { splitIntoRows } from "../../shared/utils/split-into-rows";
import {
  type TagChipItem,
  toTagChipItems,
} from "../../shared/utils/tag-chip-items";

/**
 * トップページのカテゴリタブ。
 *
 * トップに全法案は載せられないので、カテゴリから一覧へ入る導線を先頭に置く。
 * 各タブは `/bills` をタグで絞った状態にリンクする。
 *
 * 件数はそのタグが持つ議案数。`/bills` 側は全会期の公開議案を数えるため、
 * 遷移先の件数とは一致しない。
 *
 * 狭い画面では2行、広い画面では1行にする。同じ並びを2つの構造で出し分ける
 * のは、1行を折り返して2行にすると横スクロールが効かず、逆に2行を横に
 * つなげるとタブの並び順が入れ替わってしまうため。
 *
 * 横スクロールと送り矢印は CategoryTabScroller が持つ。
 */
export function CategoryTabs({
  billsByTag,
  featuredAnchor,
}: {
  billsByTag: BillsByTag[];
  /** 注目セクションの id。閉会中はセクションが無いので渡さない。 */
  featuredAnchor?: string;
}) {
  const tagItems = toTagChipItems(billsByTag);
  if (tagItems.length === 0) return null;

  // 2行のときも「注目」は先頭に置き、タグだけを行に振り分ける。
  const [firstRow, secondRow] = splitIntoRows(tagItems, 2);

  return (
    <nav aria-label="カテゴリ">
      <CategoryTabScroller>
        <div className="hidden items-center gap-2 sm:flex">
          {featuredAnchor && <FeaturedAnchorChip anchor={featuredAnchor} />}
          {tagItems.map((item) => (
            <TagChip key={item.id} item={item} />
          ))}
        </div>

        <div className="flex flex-col gap-1.5 sm:hidden">
          <div className="flex items-center gap-1.5">
            {featuredAnchor && <FeaturedAnchorChip anchor={featuredAnchor} />}
            {firstRow.map((item) => (
              <TagChip key={item.id} item={item} />
            ))}
          </div>
          {secondRow.length > 0 && (
            <div className="flex items-center gap-1.5">
              {secondRow.map((item) => (
                <TagChip key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </CategoryTabScroller>
    </nav>
  );
}

/** ページ内の注目セクションへ送るチップ。一覧への絞り込みではない。 */
function FeaturedAnchorChip({ anchor }: { anchor: string }) {
  return (
    <a
      href={`#${anchor}`}
      className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border border-black bg-mirai-brand-teal px-4 text-[13px] font-bold text-white"
    >
      注目
    </a>
  );
}

function TagChip({ item }: { item: TagChipItem }) {
  return (
    <TagChipLink
      href={billsListHref(DEFAULT_BILLS_LIST_PARAMS, { tagId: item.id })}
      label={item.label}
      count={item.count}
    />
  );
}
