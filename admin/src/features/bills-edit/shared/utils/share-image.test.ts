import { describe, expect, it } from "vitest";
import {
  buildShareImagePreviewPath,
  estimateLineWidthInEm,
  isAllowedSharePhotoUrl,
  parseShareImageInput,
  splitShareImageTitle,
  validateShareImageTitle,
} from "./share-image";

const SUPABASE_URL = "https://example.supabase.co";
const PHOTO_URL = `${SUPABASE_URL}/storage/v1/object/public/bill-thumbnails/share-src_abc_123.jpg`;

describe("splitShareImageTitle", () => {
  it("改行で分割し、前後の空白と空行を取り除く", () => {
    expect(splitShareImageTitle(" 一行目 \r\n\n二行目\r三行目\n")).toEqual([
      "一行目",
      "二行目",
      "三行目",
    ]);
  });
});

describe("estimateLineWidthInEm", () => {
  it("全角を1、半角を0.6として数える", () => {
    expect(estimateLineWidthInEm("法案")).toBe(2);
    expect(estimateLineWidthInEm("AI画像")).toBeCloseTo(3.2);
  });
});

describe("validateShareImageTitle", () => {
  it("3行以内・60文字以内なら行の配列を返す", () => {
    expect(
      validateShareImageTitle(
        "通信制・定時制高校で\nきちんとした教育が\n行われるようにする法案"
      )
    ).toEqual({
      ok: true,
      lines: [
        "通信制・定時制高校で",
        "きちんとした教育が",
        "行われるようにする法案",
      ],
    });
  });

  it("空ならエラー", () => {
    expect(validateShareImageTitle(" \n ").ok).toBe(false);
  });

  it("4行以上ならエラー", () => {
    expect(validateShareImageTitle("あ\nい\nう\nえ")).toEqual({
      ok: false,
      error: "タイトルは3行以内にしてください",
    });
  });

  it("改行を除いて60文字を超えるとエラー", () => {
    const line = "a".repeat(20);
    expect(validateShareImageTitle(`${line}\n${line}\n${line}`).ok).toBe(true);
    expect(validateShareImageTitle(`${line}\n${line}\n${line}b`)).toEqual({
      ok: false,
      error: "タイトルは改行を除いて60文字以内にしてください",
    });
  });

  it("1行が画像幅に収まらない場合は行番号つきでエラー", () => {
    expect(validateShareImageTitle(`短い\n${"あ".repeat(15)}`)).toEqual({
      ok: false,
      error: "2行目が長すぎて画像に収まりません。改行を入れてください",
    });
  });
});

describe("isAllowedSharePhotoUrl", () => {
  it("自前 Supabase の bill-thumbnails 公開 URL は許可する", () => {
    expect(isAllowedSharePhotoUrl(PHOTO_URL, SUPABASE_URL)).toBe(true);
  });

  it.each([
    [
      "別オリジン",
      "https://evil.example.com/storage/v1/object/public/bill-thumbnails/a.jpg",
    ],
    ["別バケット", `${SUPABASE_URL}/storage/v1/object/public/other/a.jpg`],
    [
      "サブディレクトリ",
      `${SUPABASE_URL}/storage/v1/object/public/bill-thumbnails/a/b.jpg`,
    ],
    [
      "パストラバーサル",
      `${SUPABASE_URL}/storage/v1/object/public/bill-thumbnails/%2e%2e/x`,
    ],
    [
      "認証情報つき",
      "https://user:pass@example.supabase.co/storage/v1/object/public/bill-thumbnails/a.jpg",
    ],
    ["URL でない文字列", "not a url"],
  ])("%s は拒否する", (_, url) => {
    expect(isAllowedSharePhotoUrl(url, SUPABASE_URL)).toBe(false);
  });

  it("ポートが違えば拒否する", () => {
    expect(
      isAllowedSharePhotoUrl(
        "http://127.0.0.1:9999/storage/v1/object/public/bill-thumbnails/a.jpg",
        "http://127.0.0.1:54421"
      )
    ).toBe(false);
  });
});

describe("parseShareImageInput", () => {
  it("写真なしでも requirePhoto が false なら通す", () => {
    expect(
      parseShareImageInput({
        title: "法案",
        photoUrl: null,
        supabaseUrl: SUPABASE_URL,
        requirePhoto: false,
      })
    ).toEqual({ ok: true, lines: ["法案"], photoUrl: null });
  });

  it("requirePhoto が true で写真がなければエラー", () => {
    expect(
      parseShareImageInput({
        title: "法案",
        photoUrl: null,
        supabaseUrl: SUPABASE_URL,
        requirePhoto: true,
      }).ok
    ).toBe(false);
  });

  it("許可されない写真 URL はエラー", () => {
    expect(
      parseShareImageInput({
        title: "法案",
        photoUrl: "http://169.254.169.254/latest/meta-data",
        supabaseUrl: SUPABASE_URL,
        requirePhoto: false,
      })
    ).toEqual({ ok: false, error: "背景写真の URL が不正です" });
  });

  it("title が null ならエラー", () => {
    expect(
      parseShareImageInput({
        title: null,
        photoUrl: PHOTO_URL,
        supabaseUrl: SUPABASE_URL,
        requirePhoto: true,
      }).ok
    ).toBe(false);
  });
});

describe("buildShareImagePreviewPath", () => {
  it("title と photoUrl をクエリに入れる", () => {
    const path = buildShareImagePreviewPath({
      title: "一行目\n二行目",
      photoUrl: PHOTO_URL,
    });
    const url = new URL(path, "http://localhost");
    expect(url.pathname).toBe("/api/bill-share-image");
    expect(url.searchParams.get("title")).toBe("一行目\n二行目");
    expect(url.searchParams.get("photoUrl")).toBe(PHOTO_URL);
  });

  it("photoUrl がなければクエリに含めない", () => {
    const path = buildShareImagePreviewPath({ title: "法案", photoUrl: null });
    expect(new URL(path, "http://localhost").searchParams.has("photoUrl")).toBe(
      false
    );
  });
});
