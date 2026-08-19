import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { routes } from "@/lib/routes";
import { BillSearchCard } from "../../client/components/bill-list/bill-search-card";
import { BillsSortSelect } from "../../client/components/bill-list/bills-sort-select";
import type { BillTag, BillWithContent } from "../../shared/types";
import {
  BILL_STATUS_GROUP_LABELS,
  BILL_STATUS_GROUPS,
  countByStatusGroup,
  filterByStatusGroup,
} from "../../shared/utils/bill-status-group";
import {
  type BillsListSearchParams,
  buildBillsListQuery,
  parseBillsListParams,
} from "../../shared/utils/parse-bills-list-params";
import { searchBills } from "../../shared/utils/search-bills";
import { sortBills } from "../../shared/utils/sort-bills";
import { getBillsWithReportCounts } from "../loaders/get-bills-with-report-counts";

/**
 * 法案一覧（/bills）。
 *
 * 絞り込みの状態はすべて URL に載せる。並び替え以外はリンクで完結するので、
 * ページ全体を Server Component のまま保てる。
 */
export async function BillsListPage({
  searchParams,
}: {
  searchParams: BillsListSearchParams;
}) {
  const params = parseBillsListParams(searchParams);
  const allBills = await getBillsWithReportCounts();

  // キーワードとタグで母集合を絞ってから件数を数える。ステータスのタブに出す
  // 数字が、他の絞り込みを反映した実際の件数になるようにする。
  const scoped = applyScope(
    allBills,
    params.query,
    params.tagId,
    params.interviewOnly
  );
  const statusCounts = countByStatusGroup(scoped);
  const bills = sortBills(
    filterByStatusGroup(scoped, params.status),
    params.sort
  );

  const tags = collectTags(allBills);
  // typedRoutes はクエリ付きのテンプレート文字列を推論できないため、
  // リンク生成をここに集約してキャストも1箇所に閉じる。
  const href = (patch: Parameters<typeof buildBillsListQuery>[1]) =>
    `${routes.billsList()}${buildBillsListQuery(params, patch)}` as Route;

  return (
    <Container className="py-8">
      <nav
        aria-label="パンくず"
        className="mb-3 flex items-center gap-2 text-[13px]"
      >
        <Link
          href={routes.home()}
          className="text-mirai-text-secondary hover:underline"
        >
          トップ
        </Link>
        <span className="text-mirai-text-placeholder">›</span>
        <span className="font-medium">法案一覧</span>
      </nav>

      <h1 className="mb-4 text-3xl font-bold">法案一覧</h1>

      <form action={routes.billsList()} className="mb-5">
        <div className="flex items-center gap-2 rounded-full border border-mirai-border px-4 py-2.5">
          <Search
            className="h-4 w-4 shrink-0 text-mirai-text-placeholder"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={params.query}
            placeholder="法案名やキーワードで探す"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        {/* 検索しても他の絞り込みを落とさない */}
        {params.status !== "all" && (
          <input type="hidden" name="status" value={params.status} />
        )}
        {params.tagId && (
          <input type="hidden" name="tag" value={params.tagId} />
        )}
        {params.sort !== "new" && (
          <input type="hidden" name="sort" value={params.sort} />
        )}
        {params.interviewOnly && (
          <input type="hidden" name="interview" value="1" />
        )}
      </form>

      <FilterGroup label="ステータス">
        {BILL_STATUS_GROUPS.map((group) => (
          <Chip
            key={group}
            href={href({ status: group })}
            active={params.status === group}
            label={`${BILL_STATUS_GROUP_LABELS[group]} ${statusCounts[group]}`}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="カテゴリ">
        <Chip
          href={href({ tagId: null })}
          active={params.tagId === null}
          label="すべて"
        />
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            href={href({ tagId: tag.id })}
            active={params.tagId === tag.id}
            label={tag.label}
          />
        ))}
      </FilterGroup>

      <Link
        href={href({ interviewOnly: !params.interviewOnly })}
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-bold"
      >
        <span
          className={`flex h-[18px] w-[18px] items-center justify-center rounded border ${
            params.interviewOnly
              ? "border-mirai-brand-teal bg-mirai-brand-teal"
              : "border-mirai-border"
          }`}
          aria-hidden
        >
          {params.interviewOnly && (
            <span className="text-[11px] leading-none text-white">✓</span>
          )}
        </span>
        AIインタビュー受付中のみ表示
      </Link>

      <div className="mb-3 flex items-center gap-3">
        <p className="text-[13px] font-bold text-mirai-text-secondary">
          {bills.length}件の法案
        </p>
        <BillsSortSelect params={params} />
      </div>

      {bills.length === 0 ? (
        <p className="rounded-xl border border-mirai-border bg-white p-8 text-center text-sm text-mirai-text-secondary">
          条件に一致する法案がありません。キーワードや絞り込みを変えてお試しください。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bills.map((bill) => (
            <li key={bill.id}>
              <BillSearchCard bill={bill} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 text-[13px] font-bold text-mirai-text-secondary">
        {label}
      </h2>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </section>
  );
}

function Chip({
  href,
  active,
  label,
}: {
  href: Route;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap ${
        active
          ? "border-mirai-brand-teal bg-mirai-surface-light text-mirai-brand-teal"
          : "border-mirai-border bg-white text-mirai-text"
      }`}
    >
      {label}
    </Link>
  );
}

/** ステータス以外の絞り込み。タブの件数を出すために先に適用する。 */
function applyScope(
  bills: BillWithContent[],
  query: string,
  tagId: string | null,
  interviewOnly: boolean
): BillWithContent[] {
  let scoped = searchBills(bills, query);
  if (tagId) {
    scoped = scoped.filter((bill) => bill.tags.some((tag) => tag.id === tagId));
  }
  if (interviewOnly) {
    scoped = scoped.filter((bill) => bill.hasPublicInterview);
  }
  return scoped;
}

/** 実際に法案が紐づくタグだけをチップに出す。0件のカテゴリを並べない。 */
function collectTags(bills: BillWithContent[]): BillTag[] {
  const byId = new Map<string, BillTag>();
  for (const bill of bills) {
    for (const tag of bill.tags) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()];
}
