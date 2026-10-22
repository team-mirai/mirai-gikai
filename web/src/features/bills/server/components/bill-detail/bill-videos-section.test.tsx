// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillVideosSection } from "./bill-videos-section";

describe("BillVideosSection", () => {
  it("見出しと動画を渡された順に出す", () => {
    render(
      <BillVideosSection
        videos={[
          { id: "v1", youtube_video_id: "AAAAAAAAAAA", title: "第1回" },
          { id: "v2", youtube_video_id: "BBBBBBBBBBB", title: "第2回" },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "🎥チームみらいの党内議論" })
    ).toBeInTheDocument();
    const titles = screen
      .getAllByText(/^第\d回$/)
      .map((element) => element.textContent);
    expect(titles).toEqual(["第1回", "第2回"]);
  });
});
