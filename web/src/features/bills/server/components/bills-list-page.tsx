import { Check, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import { BillSearchCard } from "../../client/components/bill-list/bill-search-card";
import { BillsSortSelect } from "../../client/components/bill-list/bills-sort-select";
import {
  BILL_STATUS_GROUP_LABELS,
  BILL_STATUS_GROUPS,
  countByStatusGroup,
  filterByStatusGroup,
} from "../../shared/utils/bill-status-group";
import { collectBillTags, filterBills } from "../../shared/utils/filter-bills";
import {
  type BillsListParams,
  type BillsListSearchParams,
  billsListHref,
  parseBillsListParams,
} from "../../shared/utils/parse-bills-list-params";
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
  const scoped = filterBills(allBills, params);
  const statusCounts = countByStatusGroup(scoped);
  const bills = sortBills(
    filterByStatusGroup(scoped, params.status),
    params.sort
  );

  const tags = collectBillTags(allBills);
  // typedRoutes はクエリ付きのテンプレート文字列を推論できないため、
  // リンク生成をここに集約してキャストも1箇所に閉じる。
  const href = (patch: Partial<BillsListParams>) =>
    billsListHref(params, patch);

  return (
    <Container className="pt-24 pb-8 md:pt-8">
      <div className="mb-3">
        <Breadcrumb
          items={[
            { label: "トップ", href: routes.home() },
            { label: "法案一覧" },
          ]}
        />
      </div>

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
            aria-label="法案を検索"
            defaultValue={params.query}
            placeholder="法案名やキーワードで探す"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        {/*
          検索しても他の絞り込みを落とさない。既定値を出さない規則は
          buildBillsListQuery が持っているので、そこから導出する。
          q はテキスト入力が持つので取り除く。
        */}
        {[
          ...new URLSearchParams(
            billsListHref(params, { query: "" }).split("?")[1] ?? ""
          ),
        ].map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
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

      <section className="mb-4">
        <h2 className="mb-2 text-[13px] font-bold text-mirai-text-secondary">
          カテゴリ
        </h2>
        {/*
          タグは本番で18件あり、折り返すと縦に伸びて一覧が押し下がる。
          2行に詰めて横スクロールさせる。行の割り当ては grid-flow-col に任せる
          （列ごとに上→下へ詰まるので、左から順に読める並びになる）。
        */}
        <div className="scrollbar-hide overflow-x-auto">
          <div className="grid w-max grid-flow-col grid-rows-2 justify-items-start gap-1.5">
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
          </div>
        </div>
      </section>

      {/*
        リンクで絞り込むのでフォーム部品ではないが、見た目はチェックボックスなので
        状態が支援技術にも伝わるようにする。
      */}
      <Link
        href={href({ interviewOnly: !params.interviewOnly })}
        role="checkbox"
        aria-checked={params.interviewOnly}
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
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
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
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap ${
        active
          ? "border-transparent bg-mirai-gradient text-mirai-text"
          : "border-mirai-border bg-white text-mirai-text"
      }`}
    >
      {label}
    </Link>
  );
}
