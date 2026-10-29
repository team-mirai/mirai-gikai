import { describe, expect, it } from "vitest";
import {
  buildYouTubeEmbedUrl,
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  isYouTubePlaceholderThumbnail,
  parseYouTubeVideoId,
} from "./youtube";

describe("parseYouTubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=bvAnJyl9IDI", "bvAnJyl9IDI"],
    ["https://www.youtube.com/watch?v=bvAnJyl9IDI&t=120s", "bvAnJyl9IDI"],
    ["https://m.youtube.com/watch?v=bvAnJyl9IDI", "bvAnJyl9IDI"],
    ["https://youtube.com/watch?feature=share&v=bvAnJyl9IDI", "bvAnJyl9IDI"],
    ["https://youtu.be/bvAnJyl9IDI", "bvAnJyl9IDI"],
    ["https://youtu.be/bvAnJyl9IDI?si=abc", "bvAnJyl9IDI"],
    ["https://www.youtube.com/live/bvAnJyl9IDI?si=abc", "bvAnJyl9IDI"],
    ["https://www.youtube.com/shorts/bvAnJyl9IDI", "bvAnJyl9IDI"],
    ["https://www.youtube.com/embed/bvAnJyl9IDI", "bvAnJyl9IDI"],
    ["https://www.youtube-nocookie.com/embed/bvAnJyl9IDI", "bvAnJyl9IDI"],
  ])("%s から動画IDを取り出す", (input, expected) => {
    expect(parseYouTubeVideoId(input)).toBe(expected);
  });

  it("動画IDそのもの（前後の空白付き）も受け付ける", () => {
    expect(parseYouTubeVideoId("  bvAnJyl9IDI ")).toBe("bvAnJyl9IDI");
  });

  it.each([
    [""],
    ["not a url"],
    ["https://example.com/watch?v=bvAnJyl9IDI"],
    ["https://www.youtube.com/watch"],
    ["https://www.youtube.com/watch?v=short"],
    ["https://www.youtube.com/@teammirai"],
    ["https://www.youtube.com/playlist?list=PL123"],
  ])("%s は null を返す", (input) => {
    expect(parseYouTubeVideoId(input)).toBeNull();
  });
});

describe("buildYouTubeWatchUrl", () => {
  it("動画IDから視聴URLを組み立て、再度パースすると同じIDに戻る", () => {
    const url = buildYouTubeWatchUrl("bvAnJyl9IDI");
    expect(url).toBe("https://www.youtube.com/watch?v=bvAnJyl9IDI");
    expect(parseYouTubeVideoId(url)).toBe("bvAnJyl9IDI");
  });
});

describe("buildYouTubeEmbedUrl", () => {
  it("youtube-nocookie の埋め込みURLを自動再生付きで組み立てる", () => {
    expect(buildYouTubeEmbedUrl("bvAnJyl9IDI")).toBe(
      "https://www.youtube-nocookie.com/embed/bvAnJyl9IDI?autoplay=1&rel=0"
    );
  });
});

describe("buildYouTubeThumbnailUrl", () => {
  it("サイズ指定がなければ hqdefault のURLを組み立てる", () => {
    expect(buildYouTubeThumbnailUrl("bvAnJyl9IDI")).toBe(
      "https://i.ytimg.com/vi/bvAnJyl9IDI/hqdefault.jpg"
    );
  });

  it("指定したサイズのURLを組み立てる", () => {
    expect(buildYouTubeThumbnailUrl("bvAnJyl9IDI", "hq720")).toBe(
      "https://i.ytimg.com/vi/bvAnJyl9IDI/hq720.jpg"
    );
  });
});

describe("isYouTubePlaceholderThumbnail", () => {
  it("120px 幅以下の画像はプレースホルダーとみなす", () => {
    expect(isYouTubePlaceholderThumbnail(120)).toBe(true);
    expect(isYouTubePlaceholderThumbnail(0)).toBe(true);
  });

  it("それより大きい画像は本物のサムネイルとみなす", () => {
    expect(isYouTubePlaceholderThumbnail(121)).toBe(false);
    expect(isYouTubePlaceholderThumbnail(1280)).toBe(false);
  });
});
