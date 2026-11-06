import { describe, expect, it } from "vitest";
import {
  buildBreakingNewsImagePath,
  buildBreakingNewsStepLabels,
  buildBreakingNewsSteps,
  defaultReachedStep,
  formatBreakingNewsDate,
  isPositiveBreakingNewsResult,
  parseBreakingNewsImageInput,
  suggestBreakingNewsTitleLines,
} from "./breaking-news-image";

const VALID_PARAMS = {
  originatingHouse: "HR" as const,
  result: "可決",
  reachedStep: "1",
  date: "2026-11-06",
  place: "衆議院 本会議",
  title: "飲食料品の消費税を2年間1%にし、\n中低所得の働く人に支援金を配る法案",
};

describe("buildBreakingNewsStepLabels", () => {
  it("衆議院先議なら 提出→衆議院→参議院→成立", () => {
    expect(buildBreakingNewsStepLabels("HR")).toEqual([
      "提出",
      "衆議院",
      "参議院",
      "成立",
    ]);
  });

  it("参議院先議なら 提出→参議院→衆議院→成立", () => {
    expect(buildBreakingNewsStepLabels("HC")).toEqual([
      "提出",
      "参議院",
      "衆議院",
      "成立",
    ]);
  });
});

describe("defaultReachedStep", () => {
  it("成立は最後の段、それ以外は先議院", () => {
    expect(defaultReachedStep("成立")).toBe(3);
    expect(defaultReachedStep("可決")).toBe(1);
    expect(defaultReachedStep("否決")).toBe(1);
    expect(defaultReachedStep("廃案")).toBe(1);
  });
});

describe("buildBreakingNewsSteps", () => {
  it("可決なら到達した段までを done にする", () => {
    expect(
      buildBreakingNewsSteps({
        originatingHouse: "HR",
        result: "可決",
        reachedStep: 1,
      }).map((step) => step.state)
    ).toEqual(["done", "done", "todo", "todo"]);
  });

  it("否決・廃案なら止まった段を stopped にする", () => {
    expect(
      buildBreakingNewsSteps({
        originatingHouse: "HR",
        result: "廃案",
        reachedStep: 2,
      }).map((step) => step.state)
    ).toEqual(["done", "done", "stopped", "todo"]);
  });
});

describe("isPositiveBreakingNewsResult", () => {
  it("成立・可決は true、否決・廃案は false", () => {
    expect(isPositiveBreakingNewsResult("成立")).toBe(true);
    expect(isPositiveBreakingNewsResult("可決")).toBe(true);
    expect(isPositiveBreakingNewsResult("否決")).toBe(false);
    expect(isPositiveBreakingNewsResult("廃案")).toBe(false);
  });
});

describe("formatBreakingNewsDate", () => {
  it("YYYY-MM-DD を和文の日付にする", () => {
    expect(formatBreakingNewsDate("2026-11-06")).toBe("2026年11月6日");
  });

  it("形式が違えば null", () => {
    expect(formatBreakingNewsDate("2026/11/06")).toBeNull();
  });
});

describe("suggestBreakingNewsTitleLines", () => {
  it("幅を超える位置より前の読点で折り返す", () => {
    expect(
      suggestBreakingNewsTitleLines(
        "飲食料品の消費税を2年間1%にし、中低所得の働く人に支援金を配る法案"
      )
    ).toBe(
      "飲食料品の消費税を2年間1%にし、\n中低所得の働く人に支援金を配る法案"
    );
  });

  it("短いタイトルはそのまま", () => {
    expect(suggestBreakingNewsTitleLines("  短い法案 ")).toBe("短い法案");
  });

  it("すでに改行があれば手を加えない", () => {
    expect(suggestBreakingNewsTitleLines("一行目\n二行目")).toBe(
      "一行目\n二行目"
    );
  });
});

describe("parseBreakingNewsImageInput", () => {
  it("正しい入力なら描画用の値を返す", () => {
    expect(parseBreakingNewsImageInput(VALID_PARAMS)).toEqual({
      ok: true,
      result: "可決",
      steps: [
        { label: "提出", state: "done" },
        { label: "衆議院", state: "done" },
        { label: "参議院", state: "todo" },
        { label: "成立", state: "todo" },
      ],
      meta: "2026年11月6日｜衆議院 本会議",
      titleLines: [
        "飲食料品の消費税を2年間1%にし、",
        "中低所得の働く人に支援金を配る法案",
      ],
    });
  });

  it("日付と場所は空でもよい", () => {
    const parsed = parseBreakingNewsImageInput({
      ...VALID_PARAMS,
      date: "",
      place: " ",
    });
    expect(parsed.ok && parsed.meta).toBe("");
  });

  it("想定外の結果はエラー", () => {
    expect(
      parseBreakingNewsImageInput({ ...VALID_PARAMS, result: "継続審議" })
    ).toEqual({ ok: false, error: "結果を選んでください" });
  });

  it("進み具合が範囲外ならエラー", () => {
    for (const reachedStep of ["4", "-1", "1.5", null]) {
      expect(
        parseBreakingNewsImageInput({ ...VALID_PARAMS, reachedStep }).ok
      ).toBe(false);
    }
  });

  it("日付の形式が違えばエラー", () => {
    expect(
      parseBreakingNewsImageInput({ ...VALID_PARAMS, date: "11月6日" })
    ).toEqual({ ok: false, error: "日付が不正です" });
  });

  it("場所が長すぎるとエラー", () => {
    expect(
      parseBreakingNewsImageInput({ ...VALID_PARAMS, place: "あ".repeat(31) })
        .ok
    ).toBe(false);
  });

  it("タイトルが空・3行以上・幅超えならエラー", () => {
    expect(parseBreakingNewsImageInput({ ...VALID_PARAMS, title: "" })).toEqual(
      { ok: false, error: "タイトルを入力してください" }
    );
    expect(
      parseBreakingNewsImageInput({ ...VALID_PARAMS, title: "あ\nい\nう" })
    ).toEqual({ ok: false, error: "タイトルは2行以内にしてください" });
    expect(
      parseBreakingNewsImageInput({ ...VALID_PARAMS, title: "あ".repeat(18) })
    ).toEqual({
      ok: false,
      error:
        "タイトルの1行目が長すぎて画像に収まりません。改行を入れてください",
    });
  });
});

describe("buildBreakingNewsImagePath", () => {
  it("入力をクエリに載せた画像 API のパスを返す", () => {
    const path = buildBreakingNewsImagePath({
      billId: "bill-1",
      result: "成立",
      reachedStep: 3,
      date: "2026-11-06",
      place: "参議院 本会議",
      title: "一行目\n二行目",
    });
    const url = new URL(path, "http://localhost");
    expect(url.pathname).toBe("/api/bill-breaking-news-image");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      billId: "bill-1",
      result: "成立",
      reachedStep: "3",
      date: "2026-11-06",
      place: "参議院 本会議",
      title: "一行目\n二行目",
    });
  });
});
