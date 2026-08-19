import type { Route } from "next";
import { routes } from "@/lib/routes";
import { type BillStatusGroup, isBillStatusGroup } from "./bill-status-group";
import {
  type BillSortKey,
  DEFAULT_BILL_SORT,
  isBillSortKey,
} from "./sort-bills";

/** 一覧の絞り込み状態。すべて URL に載せる。 */
export type BillsListParams = {
  query: string;
  status: BillStatusGroup;
  /** タグ id。null は「すべて」。 */
  tagId: string | null;
  sort: BillSortKey;
  /** AIインタビュー受付中のみに絞るか。 */
  interviewOnly: boolean;
};

/** ページ・コンポーネント間で共有する searchParams の形。 */
export type BillsListSearchParams = {
  q?: string | string[];
  status?: string | string[];
  tag?: string | string[];
  sort?: string | string[];
  interview?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * URL パラメータを一覧の状態に正規化する純粋関数。
 * 不正値は既定に倒す。URL 直打ちでページを壊せないようにする。
 */
export function parseBillsListParams(
  searchParams: BillsListSearchParams
): BillsListParams {
  const status = firstValue(searchParams.status);
  const sort = firstValue(searchParams.sort);
  const tag = firstValue(searchParams.tag)?.trim();

  return {
    query: firstValue(searchParams.q)?.trim() ?? "",
    status: isBillStatusGroup(status) ? status : "all",
    tagId: tag || null,
    sort: isBillSortKey(sort) ? sort : DEFAULT_BILL_SORT,
    interviewOnly: firstValue(searchParams.interview) === "1",
  };
}

/**
 * 現在の状態から1つだけ差し替えたクエリ文字列を作る純粋関数。
 * 既定値はURLに出さない。共有されたURLが読みやすくなる。
 */
export function buildBillsListQuery(
  current: BillsListParams,
  patch: Partial<BillsListParams> = {}
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();

  if (next.query) params.set("q", next.query);
  if (next.status !== "all") params.set("status", next.status);
  if (next.tagId) params.set("tag", next.tagId);
  if (next.sort !== DEFAULT_BILL_SORT) params.set("sort", next.sort);
  if (next.interviewOnly) params.set("interview", "1");

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * 一覧ページへのリンク。typedRoutes はクエリ付きのテンプレート文字列を
 * 推論できないため、キャストをこの関数だけに閉じる。
 */
export function billsListHref(
  current: BillsListParams,
  patch: Partial<BillsListParams> = {}
): Route {
  return `${routes.billsList()}${buildBillsListQuery(current, patch)}` as Route;
}
