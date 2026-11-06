import { describe, expect, it } from "vitest";
import { toBillVideosFormInput } from "./to-bill-videos-form-input";

describe("toBillVideosFormInput", () => {
  it("登録済みの動画を種類ごとの URL・タイトルに変換する", () => {
    const result = toBillVideosFormInput([
      { kind: "caucus", youtube_video_id: "BBBBBBBBBBB", title: "議員団MTG" },
      {
        kind: "stance_decision",
        youtube_video_id: "AAAAAAAAAAA",
        title: "賛否MTG",
      },
    ]);

    expect(result).toEqual({
      stance_decision: {
        url: "https://www.youtube.com/watch?v=AAAAAAAAAAA",
        title: "賛否MTG",
      },
      caucus: {
        url: "https://www.youtube.com/watch?v=BBBBBBBBBBB",
        title: "議員団MTG",
      },
    });
  });

  it("未登録の種類は空欄にする", () => {
    expect(toBillVideosFormInput([])).toEqual({
      stance_decision: { url: "", title: "" },
      caucus: { url: "", title: "" },
    });
  });
});
