import { describe, expect, it } from "vitest";
import { getImageExtension } from "./image-extension";

describe("getImageExtension", () => {
  it.each([
    ["image/jpeg", "photo.JPEG", "jpg"],
    ["image/png", "スクリーンショット 2026.png", "png"],
    ["image/webp", "a.webp", "webp"],
  ])("%s は MIME から拡張子を決める", (mime, name, expected) => {
    expect(getImageExtension(mime, name)).toBe(expected);
  });

  it("未知の MIME ならファイル名の拡張子を小文字で使う", () => {
    expect(getImageExtension("image/avif", "a.AVIF")).toBe("avif");
  });

  it("ファイル名の拡張子が英数字でなければ img にする", () => {
    expect(getImageExtension("", "a.j pg")).toBe("img");
    expect(getImageExtension("", "noext")).toBe("img");
  });
});
