import { describe, expect, it } from "vitest";
import type { MiraiStance } from "../types";
import {
  getInitialReasonFormat,
  toStanceFormValues,
  toStanceInput,
} from "./stance-form-values";

const baseStance: MiraiStance = {
  id: "stance-1",
  bill_id: "bill-1",
  type: "for",
  comment: null,
  reason_summary: null,
  reason_points: [],
  supplements: [],
  publish_at: null,
  created_at: "2026-10-01T00:00:00+00:00",
  updated_at: "2026-10-01T00:00:00+00:00",
};

describe("getInitialReasonFormat", () => {
  it("スタンス未作成なら新フォーマット", () => {
    expect(getInitialReasonFormat(null)).toBe("new");
  });

  it("旧フォーマットのコメントのみなら旧フォーマット", () => {
    expect(getInitialReasonFormat({ ...baseStance, comment: "理由" })).toBe(
      "old"
    );
  });

  it("新フォーマットのデータがあればコメントがあっても新フォーマット", () => {
    expect(
      getInitialReasonFormat({
        ...baseStance,
        comment: "理由",
        reason_summary: "一言",
      })
    ).toBe("new");
  });

  it("どちらも未入力なら新フォーマット", () => {
    expect(getInitialReasonFormat(baseStance)).toBe("new");
  });
});

describe("toStanceFormValues", () => {
  it("保存済みの値をフォームの初期値に変換する", () => {
    expect(
      toStanceFormValues({
        ...baseStance,
        comment: "旧コメント",
        reason_summary: "一言",
        reason_points: ["根拠1", "根拠2"],
        supplements: [{ title: "見出し", body: "本文" }],
        publish_at: "2026-09-30T15:30:00+00:00",
      })
    ).toEqual({
      type: "for",
      comment: "旧コメント",
      reasonSummary: "一言",
      reasonPoints: [{ value: "根拠1" }, { value: "根拠2" }],
      supplements: [{ title: "見出し", body: "本文" }],
      publishAtLocal: "2026-10-01T00:30",
    });
  });

  it("箇条書きが未入力なら空欄を3つ用意する", () => {
    expect(toStanceFormValues(null).reasonPoints).toEqual([
      { value: "" },
      { value: "" },
      { value: "" },
    ]);
  });
});

describe("toStanceInput", () => {
  it("フォームの値を保存用の入力に変換する", () => {
    expect(
      toStanceInput(
        {
          type: "against",
          comment: "旧コメント",
          reasonSummary: "一言",
          reasonPoints: [{ value: "根拠1" }, { value: "" }],
          supplements: [{ title: "見出し", body: "本文" }],
          publishAtLocal: "2026-10-02T09:30",
        },
        null
      )
    ).toEqual({
      type: "against",
      comment: "旧コメント",
      reasonSummary: "一言",
      reasonPoints: ["根拠1", ""],
      supplements: [{ title: "見出し", body: "本文" }],
      publishAt: "2026-10-02T09:30:00+09:00",
    });
  });
});
