import type { OriginatingHouse } from "@/features/bills/shared/types";
import { HOUSE_LABELS } from "@/features/bills/shared/types";
import { estimateLineWidthInEm, splitShareImageTitle } from "./share-image";

export const BREAKING_NEWS_RESULTS = ["成立", "可決", "否決", "廃案"] as const;
export type BreakingNewsResult = (typeof BREAKING_NEWS_RESULTS)[number];

/** 否決・廃案は「止まった段」に×を付ける */
const STOPPED_RESULTS: readonly BreakingNewsResult[] = ["否決", "廃案"];

export const BREAKING_NEWS_TITLE_MAX_LINES = 2;
export const BREAKING_NEWS_TITLE_FONT_SIZE = 72;
export const BREAKING_NEWS_TITLE_MAX_WIDTH = 1290;
export const BREAKING_NEWS_META_MAX_LENGTH = 30;

export type BreakingNewsStepState = "done" | "stopped" | "todo";

export interface BreakingNewsStep {
  label: string;
  state: BreakingNewsStepState;
}

/** 提出 → 先議院 → 後議院 → 成立 の4段 */
export function buildBreakingNewsStepLabels(
  originatingHouse: OriginatingHouse
): string[] {
  const receivingHouse = originatingHouse === "HR" ? "HC" : "HR";
  return [
    "提出",
    HOUSE_LABELS[originatingHouse],
    HOUSE_LABELS[receivingHouse],
    "成立",
  ];
}

/** 結果を選んだときの「どこまで進んだか」の初期値(0始まりの段番号) */
export function defaultReachedStep(result: BreakingNewsResult): number {
  return result === "成立" ? 3 : 1;
}

export function buildBreakingNewsSteps(params: {
  originatingHouse: OriginatingHouse;
  result: BreakingNewsResult;
  reachedStep: number;
}): BreakingNewsStep[] {
  const stopped = STOPPED_RESULTS.includes(params.result);
  return buildBreakingNewsStepLabels(params.originatingHouse).map(
    (label, index) => {
      if (index < params.reachedStep) return { label, state: "done" };
      if (index === params.reachedStep) {
        return { label, state: stopped ? "stopped" : "done" };
      }
      return { label, state: "todo" };
    }
  );
}

export function isPositiveBreakingNewsResult(
  result: BreakingNewsResult
): boolean {
  return !STOPPED_RESULTS.includes(result);
}

/** "2026-11-06" → "2026年11月6日" */
export function formatBreakingNewsDate(date: string): string | null {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

const LINE_BREAK_AFTER = /[、。・ 　]/;

/**
 * 改行が無いタイトルを、画像の幅に収まる位置で折り返した初期値にする。
 * 行の後半に読点などがあれば、そこで折り返す
 */
export function suggestBreakingNewsTitleLines(title: string): string {
  const trimmed = title.trim();
  if (trimmed.includes("\n")) return trimmed;
  const maxEm = BREAKING_NEWS_TITLE_MAX_WIDTH / BREAKING_NEWS_TITLE_FONT_SIZE;
  const lines: string[] = [];
  let current: string[] = [];
  for (const char of trimmed) {
    if (
      current.length > 0 &&
      estimateLineWidthInEm(current.join("") + char) > maxEm
    ) {
      const breakAt = current.findLastIndex((c) => LINE_BREAK_AFTER.test(c));
      const cut = breakAt >= current.length / 2 ? breakAt + 1 : current.length;
      lines.push(current.slice(0, cut).join("").trim());
      current = current.slice(cut);
    }
    current.push(char);
  }
  if (current.length > 0) lines.push(current.join("").trim());
  return lines.join("\n");
}

export type BreakingNewsImageInput = {
  result: BreakingNewsResult;
  steps: BreakingNewsStep[];
  meta: string;
  titleLines: string[];
};

export type BreakingNewsImageValidation =
  | ({ ok: true } & BreakingNewsImageInput)
  | { ok: false; error: string };

export function parseBreakingNewsImageInput(params: {
  originatingHouse: OriginatingHouse;
  result: string | null;
  reachedStep: string | null;
  date: string | null;
  place: string | null;
  title: string | null;
}): BreakingNewsImageValidation {
  const result = BREAKING_NEWS_RESULTS.find((r) => r === params.result);
  if (!result) return { ok: false, error: "結果を選んでください" };

  const labels = buildBreakingNewsStepLabels(params.originatingHouse);
  const reachedStep = params.reachedStep ? Number(params.reachedStep) : NaN;
  if (
    !Number.isInteger(reachedStep) ||
    reachedStep < 0 ||
    reachedStep >= labels.length
  ) {
    return { ok: false, error: "進み具合が不正です" };
  }

  const date = params.date ? formatBreakingNewsDate(params.date) : "";
  if (date === null) return { ok: false, error: "日付が不正です" };
  const place = (params.place ?? "").trim();
  if ([...place].length > BREAKING_NEWS_META_MAX_LENGTH) {
    return {
      ok: false,
      error: `場所は${BREAKING_NEWS_META_MAX_LENGTH}文字以内にしてください`,
    };
  }

  const titleLines = splitShareImageTitle(params.title ?? "");
  if (titleLines.length === 0) {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (titleLines.length > BREAKING_NEWS_TITLE_MAX_LINES) {
    return {
      ok: false,
      error: `タイトルは${BREAKING_NEWS_TITLE_MAX_LINES}行以内にしてください`,
    };
  }
  const maxEm = BREAKING_NEWS_TITLE_MAX_WIDTH / BREAKING_NEWS_TITLE_FONT_SIZE;
  const overflowIndex = titleLines.findIndex(
    (line) => estimateLineWidthInEm(line) > maxEm
  );
  if (overflowIndex !== -1) {
    return {
      ok: false,
      error: `タイトルの${overflowIndex + 1}行目が長すぎて画像に収まりません。改行を入れてください`,
    };
  }

  return {
    ok: true,
    result,
    steps: buildBreakingNewsSteps({
      originatingHouse: params.originatingHouse,
      result,
      reachedStep,
    }),
    meta: [date, place].filter(Boolean).join("｜"),
    titleLines,
  };
}

export function buildBreakingNewsImagePath(params: {
  billId: string;
  result: BreakingNewsResult;
  reachedStep: number;
  date: string;
  place: string;
  title: string;
}): string {
  const search = new URLSearchParams({
    billId: params.billId,
    result: params.result,
    reachedStep: String(params.reachedStep),
    date: params.date,
    place: params.place,
    title: params.title,
  });
  return `/api/bill-breaking-news-image?${search.toString()}`;
}
