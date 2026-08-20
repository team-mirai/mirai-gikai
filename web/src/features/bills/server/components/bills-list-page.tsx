import "server-only";

import {
  AlignLeft,
  Check,
  Clock,
  ExternalLink,
  type LucideIcon,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import { BillSearchCard } from "../../client/components/bill-list/bill-search-card";
import { BillsSortSelect } from "../../client/components/bill-list/bills-sort-select";
import type { BillStatusGroup } from "../../shared/utils/bill-status-group";
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
import { splitIntoRows } from "../../shared/utils/split-into-rows";
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
  const tagChips = [
    { id: "all", label: "すべて", tagId: null },
    ...tags.map((tag) => ({ id: tag.id, label: tag.label, tagId: tag.id })),
  ];
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
            icon={STATUS_GROUP_ICONS[group]}
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
          2行に詰めて横スクロールさせる。grid で流すと列幅が最長のチップに
          揃って短いチップの右に空白が残るので、行ごとに独立した flex にする。
        */}
        <div className="scrollbar-hide overflow-x-auto">
          <div className="flex w-max flex-col gap-1.5">
            {splitIntoRows(tagChips, 2).map((row, rowIndex) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: 行は固定順で再並びしない
                key={rowIndex}
                className="flex items-center gap-1.5"
              >
                {row.map((chip) => (
                  <Chip
                    key={chip.id}
                    href={href({ tagId: chip.tagId })}
                    active={params.tagId === chip.tagId}
                    label={chip.label}
                  />
                ))}
              </div>
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
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-mirai-border bg-white px-6 py-16 text-center">
          <Search
            className="h-10 w-10 text-mirai-text-placeholder"
            aria-hidden
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-bold">
              該当する法案が見つかりませんでした
            </p>
            <p className="text-[13px] text-mirai-text-muted">
              キーワードを変えるか、絞り込み条件を解除してお試しください
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bills.map((bill) => (
            <li key={bill.id}>
              <BillSearchCard bill={bill} />
            </li>
          ))}
        </ul>
      )}

      {/* 掲載外の法案は本家の一覧に送る */}
      <div className="mt-8 text-sm text-mirai-text-secondary">
        <Link
          href="https://www.shugiin.go.jp/internet/itdb_gian.nsf/html/gian/menu.htm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:opacity-80"
        >
          国会に提出されているすべての法案は{" "}
          <span className="underline">国会議案情報へ</span>
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </div>
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

/** ステータスごとの目印。ラベルだけの列より状態が見分けやすくなる。 */
const STATUS_GROUP_ICONS: Record<BillStatusGroup, LucideIcon> = {
  all: AlignLeft,
  deliberating: MessageSquare,
  waiting: Clock,
  enacted: Check,
  rejected: X,
};

function Chip({
  href,
  active,
  label,
  icon: Icon,
}: {
  href: Route;
  active: boolean;
  label: string;
  icon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap ${
        active
          ? "border-transparent bg-mirai-gradient text-mirai-text"
          : "border-mirai-border bg-white text-mirai-text"
      }`}
    >
      {Icon && <Icon className="h-[15px] w-[15px] shrink-0" aria-hidden />}
      {label}
    </Link>
  );
}
