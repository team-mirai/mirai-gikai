import { describe, expect, it } from "vitest";
import { buildViewerQuery, parseViewerParams } from "./parse-viewer-params";

describe("parseViewerParams", () => {
  it("未指定なら既定値", () => {
    expect(parseViewerParams({})).toEqual({
      audience: "all",
      view: "topics",
      query: "",
    });
  });

  it("指定された値を採用する", () => {
    expect(
      parseViewerParams({
        audience: "specialists",
        view: "concerns",
        q: "端末",
      })
    ).toEqual({ audience: "specialists", view: "concerns", query: "端末" });
  });

  // URL 直打ちで管理画面が壊れないように、不正値は既定に倒す。
  it("不正な audience / view を既定に倒す", () => {
    expect(parseViewerParams({ audience: "expert", view: "mindmap" })).toEqual({
      audience: "all",
      view: "topics",
      query: "",
    });
  });

  it("配列で来たら先頭を使う", () => {
    expect(
      parseViewerParams({ audience: ["experts", "all"], q: ["a", "b"] })
    ).toMatchObject({ audience: "experts", query: "a" });
  });

  it("クエリの前後空白を落とす", () => {
    expect(parseViewerParams({ q: "  端末  " }).query).toBe("端末");
  });
});

describe("buildViewerQuery", () => {
  const base = { audience: "all", view: "topics", query: "" } as const;

  it("既定値はクエリに出さない", () => {
    expect(buildViewerQuery(base, {})).toBe("");
  });

  it("差し替えた値だけ載る", () => {
    expect(buildViewerQuery(base, { audience: "experts" })).toBe(
      "?audience=experts"
    );
    expect(buildViewerQuery(base, { view: "concerns" })).toBe("?view=concerns");
  });

  it("現在の状態を保ったまま1つだけ差し替える", () => {
    const current = {
      audience: "specialists",
      view: "concerns",
      query: "端末",
    } as const;

    expect(buildViewerQuery(current, { view: "proposals" })).toBe(
      "?audience=specialists&view=proposals&q=%E7%AB%AF%E6%9C%AB"
    );
  });

  it("クエリを空にすると q が消える", () => {
    const current = { audience: "all", view: "search", query: "端末" } as const;
    expect(buildViewerQuery(current, { query: "" })).toBe("?view=search");
  });
});
