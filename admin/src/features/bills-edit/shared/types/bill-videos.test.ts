import { describe, expect, it } from "vitest";
import { billVideosInputSchema } from "./bill-videos";

const EMPTY = { url: "", title: "" };

describe("billVideosInputSchema", () => {
  it("URL を動画IDに変換し、タイトルの前後空白を除く", () => {
    const result = billVideosInputSchema.parse({
      stance_decision: {
        url: "https://www.youtube.com/watch?v=bvAnJyl9IDI",
        title: " 賛否MTG ",
      },
      caucus: { url: "https://youtu.be/AAAAAAAAAAA", title: "議員団MTG" },
    });

    expect(result).toEqual({
      stance_decision: { youtube_video_id: "bvAnJyl9IDI", title: "賛否MTG" },
      caucus: { youtube_video_id: "AAAAAAAAAAA", title: "議員団MTG" },
    });
  });

  it("URL・タイトルとも空（空白のみを含む）の種類は null にする", () => {
    const result = billVideosInputSchema.parse({
      stance_decision: { url: " ", title: "  " },
      caucus: EMPTY,
    });

    expect(result).toEqual({ stance_decision: null, caucus: null });
  });

  it("種類が欠けている入力はエラーにする", () => {
    const result = billVideosInputSchema.safeParse({ stance_decision: EMPTY });

    expect(result.success).toBe(false);
  });

  it("YouTube 以外の URL はエラーにする", () => {
    const result = billVideosInputSchema.safeParse({
      stance_decision: { url: "https://example.com/video", title: "動画" },
      caucus: EMPTY,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "YouTube の動画URLを入力してください"
    );
  });

  it("URL のみ入力されタイトルが空ならエラーにする", () => {
    const result = billVideosInputSchema.safeParse({
      stance_decision: EMPTY,
      caucus: { url: "https://youtu.be/bvAnJyl9IDI", title: "   " },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("タイトルは必須です");
  });

  it("201文字以上のタイトルはエラーにする", () => {
    const result = billVideosInputSchema.safeParse({
      stance_decision: {
        url: "https://youtu.be/bvAnJyl9IDI",
        title: "あ".repeat(201),
      },
      caucus: EMPTY,
    });

    expect(result.success).toBe(false);
  });
});
