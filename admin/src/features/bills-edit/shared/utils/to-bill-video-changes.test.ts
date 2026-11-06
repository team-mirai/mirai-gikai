import { describe, expect, it } from "vitest";
import { toBillVideoChanges } from "./to-bill-video-changes";

describe("toBillVideoChanges", () => {
  it("入力のある種類は登録行に、空の種類は削除対象に振り分ける", () => {
    const result = toBillVideoChanges("bill-1", {
      stance_decision: { youtube_video_id: "AAAAAAAAAAA", title: "賛否MTG" },
      caucus: null,
    });

    expect(result).toEqual({
      upserts: [
        {
          bill_id: "bill-1",
          kind: "stance_decision",
          youtube_video_id: "AAAAAAAAAAA",
          title: "賛否MTG",
        },
      ],
      deleteKinds: ["caucus"],
    });
  });

  it("両方入力があれば削除対象は空", () => {
    const result = toBillVideoChanges("bill-1", {
      stance_decision: { youtube_video_id: "AAAAAAAAAAA", title: "賛否MTG" },
      caucus: { youtube_video_id: "BBBBBBBBBBB", title: "議員団MTG" },
    });

    expect(result.upserts.map((row) => row.kind)).toEqual([
      "stance_decision",
      "caucus",
    ]);
    expect(result.deleteKinds).toEqual([]);
  });
});
