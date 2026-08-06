import {
  isOpinionAudience,
  type OpinionAudience,
} from "@mirai-gikai/shared/interview-report/opinion-tags";

export const VIEWER_VIEWS = [
  "topics",
  "concerns",
  "proposals",
  "grounded",
  "search",
] as const;

export type ViewerView = (typeof VIEWER_VIEWS)[number];

export const VIEWER_VIEW_LABELS: Record<ViewerView, string> = {
  topics: "論点マップ",
  concerns: "懸念",
  proposals: "具体提案",
  grounded: "専門家・根拠あり",
  search: "意見検索",
};

/** 文字列を ViewerView に絞り込む型ガード（audience 側と対称にする）。 */
export function isViewerView(value: unknown): value is ViewerView {
  return (
    typeof value === "string" &&
    (VIEWER_VIEWS as readonly string[]).includes(value)
  );
}

export type ViewerParams = {
  audience: OpinionAudience;
  view: ViewerView;
  query: string;
};

/** ページ・ローダー間で共有する searchParams の形。 */
export type ViewerSearchParams = {
  audience?: string | string[];
  view?: string | string[];
  q?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * URL パラメータをビューアの状態に正規化する純粋関数。
 * 不正値は既定にフォールバックする（管理画面をURL直打ちで壊せないように）。
 */
export function parseViewerParams(
  searchParams: ViewerSearchParams
): ViewerParams {
  const audienceRaw = firstValue(searchParams.audience);
  const viewRaw = firstValue(searchParams.view);
  const queryRaw = firstValue(searchParams.q);

  return {
    audience: isOpinionAudience(audienceRaw) ? audienceRaw : "all",
    view: isViewerView(viewRaw) ? viewRaw : "topics",
    query: queryRaw?.trim() ?? "",
  };
}

/** 現在の状態から、1つだけ差し替えたクエリ文字列を作る純粋関数。 */
export function buildViewerQuery(
  current: ViewerParams,
  patch: Partial<ViewerParams>
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.audience !== "all") params.set("audience", next.audience);
  if (next.view !== "topics") params.set("view", next.view);
  if (next.query) params.set("q", next.query);
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
