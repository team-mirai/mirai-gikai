import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildOgFontOptions,
  extractFontUrlFromCss,
  loadOgpLogoDataUrl,
} from "./og-assets";

describe("extractFontUrlFromCss", () => {
  it("TTF の URL を取り出す", () => {
    const css =
      "@font-face { font-family: 'Noto Sans JP'; src: url(https://fonts.gstatic.com/s/a.ttf) format('truetype'); }";
    expect(extractFontUrlFromCss(css)).toBe("https://fonts.gstatic.com/s/a.ttf");
  });

  it("引用符つきの URL も取り出す", () => {
    const css = `src: url("https://fonts.gstatic.com/s/b.otf") format('opentype');`;
    expect(extractFontUrlFromCss(css)).toBe("https://fonts.gstatic.com/s/b.otf");
  });

  it("woff2 しかなければ null", () => {
    const css = "src: url(https://fonts.gstatic.com/s/c.woff2) format('woff2');";
    expect(extractFontUrlFromCss(css)).toBeNull();
  });
});

describe("buildOgFontOptions", () => {
  it("フォントがあれば1件の fonts を返す", () => {
    const data = new ArrayBuffer(1);
    expect(buildOgFontOptions(data, 700)).toEqual({
      fonts: [{ name: "Noto Sans JP", data, style: "normal", weight: 700 }],
    });
  });

  it("フォントがなければ fonts を省略する", () => {
    expect(buildOgFontOptions(null, 700)).toEqual({});
  });
});

describe("loadOgpLogoDataUrl", () => {
  it("同梱の PNG を data URL で返す", async () => {
    const dataUrl = await loadOgpLogoDataUrl(
      fileURLToPath(new URL("./ogp-logo.png", import.meta.url))
    );
    expect(dataUrl).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
  });

  it("読めなければ null", async () => {
    expect(await loadOgpLogoDataUrl("/nonexistent/ogp-logo.png")).toBeNull();
  });
});
