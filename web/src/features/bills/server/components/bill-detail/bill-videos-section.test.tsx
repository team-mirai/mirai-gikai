// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillVideosSection } from "./bill-videos-section";

describe("BillVideosSection", () => {
  it("議論の種類ごとに見出しを分け、賛否→議員団の順に出す", () => {
    render(
      <BillVideosSection
        videos={[
          {
            id: "v2",
            kind: "caucus",
            youtube_video_id: "BBBBBBBBBBB",
            title: "議員団MTG",
          },
          {
            id: "v1",
            kind: "stance_decision",
            youtube_video_id: "AAAAAAAAAAA",
            title: "賛否MTG",
          },
        ]}
      />
    );

    expect(
      screen.getAllByRole("heading").map((element) => element.textContent)
    ).toEqual(["▶️賛否を決めた時の議論", "▶️議員団での議論"]);
    expect(
      screen.getAllByText(/MTG$/).map((element) => element.textContent)
    ).toEqual(["賛否MTG", "議員団MTG"]);
  });

  it("動画が登録されていない種類の見出しは出さない", () => {
    render(
      <BillVideosSection
        videos={[
          {
            id: "v2",
            kind: "caucus",
            youtube_video_id: "BBBBBBBBBBB",
            title: "議員団MTG",
          },
        ]}
      />
    );

    expect(
      screen.getAllByRole("heading").map((element) => element.textContent)
    ).toEqual(["▶️議員団での議論"]);
  });
});
