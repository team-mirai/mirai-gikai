import { describe, expect, it } from "vitest";
import { billVideosInputSchema } from "./bill-videos";

describe("billVideosInputSchema", () => {
  it("URL を動画IDに変換し、タイトルの前後空白を除く（順序は維持）", () => {
    const result = billVideosInputSchema.parse([
      { url: "https://www.youtube.com/watch?v=bvAnJyl9IDI", title: " 第1回 " },
      { url: "https://youtu.be/AAAAAAAAAAA", title: "第2回" },
    ]);

    expect(result).toEqual([
      { youtube_video_id: "bvAnJyl9IDI", title: "第1回" },
      { youtube_video_id: "AAAAAAAAAAA", title: "第2回" },
    ]);
  });

  it("空配列は許可する（全削除）", () => {
    expect(billVideosInputSchema.parse([])).toEqual([]);
  });

  it("YouTube 以外の URL はエラーにする", () => {
    const result = billVideosInputSchema.safeParse([
      { url: "https://example.com/video", title: "動画" },
    ]);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "YouTube の動画URLを入力してください"
    );
  });

  it("空白のみのタイトルはエラーにする", () => {
    const result = billVideosInputSchema.safeParse([
      { url: "https://youtu.be/bvAnJyl9IDI", title: "   " },
    ]);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("タイトルは必須です");
  });

  it("201文字以上のタイトルはエラーにする", () => {
    const result = billVideosInputSchema.safeParse([
      { url: "https://youtu.be/bvAnJyl9IDI", title: "あ".repeat(201) },
    ]);

    expect(result.success).toBe(false);
  });
});
