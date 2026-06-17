import { describe, expect, it } from "vitest";
import { resolveBillShareImageUrl } from "./bill-share-image";

const WEB_URL = "https://example.com";

describe("resolveBillShareImageUrl", () => {
  it("share_thumbnail_url を最優先で返す", () => {
    expect(
      resolveBillShareImageUrl(
        {
          share_thumbnail_url: "https://img/share.jpg",
          thumbnail_url: "https://img/thumb.jpg",
        },
        WEB_URL
      )
    ).toBe("https://img/share.jpg");
  });

  it("share_thumbnail_url が無ければ thumbnail_url を返す", () => {
    expect(
      resolveBillShareImageUrl(
        { share_thumbnail_url: null, thumbnail_url: "https://img/thumb.jpg" },
        WEB_URL
      )
    ).toBe("https://img/thumb.jpg");
  });

  it("どちらも無ければ webUrl 基準のデフォルトOGPを返す", () => {
    expect(
      resolveBillShareImageUrl(
        { share_thumbnail_url: null, thumbnail_url: null },
        WEB_URL
      )
    ).toBe("https://example.com/ogp.jpg");
  });

  it("bill が null でもデフォルトOGPを返す", () => {
    expect(resolveBillShareImageUrl(null, WEB_URL)).toBe(
      "https://example.com/ogp.jpg"
    );
  });
});
