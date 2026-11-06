import { describe, expect, it } from "vitest";
import {
  buildShareImageFrameSvg,
  SHARE_IMAGE_FRAME,
} from "./share-image-frame";

describe("buildShareImageFrameSvg", () => {
  const svg = buildShareImageFrameSvg();

  it("画像全体と同じサイズの SVG を返す", () => {
    expect(svg).toContain('width="1800" height="945"');
  });

  it("線幅の中心に枠を描き、外側の寸法を雛形に合わせる", () => {
    const half = SHARE_IMAGE_FRAME.strokeWidth / 2;
    expect(svg).toContain(
      `<rect x="${SHARE_IMAGE_FRAME.left + half}" y="${SHARE_IMAGE_FRAME.top + half}" width="1709" height="831" rx="36" ry="36"`
    );
  });

  it("タブの右上の角丸を枠の外側の角丸と揃える", () => {
    expect(svg).toContain("A42,42 0 0 1 1761,93");
  });
});
