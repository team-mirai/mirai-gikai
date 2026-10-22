// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillVideoPlayer } from "./bill-video-player";

const video = {
  id: "video-1",
  youtube_video_id: "bvAnJyl9IDI",
  title: "党内議論 第1回",
};

describe("BillVideoPlayer", () => {
  it("初期表示ではサムネイルとタイトルのみを出し、プレイヤーは読み込まない", () => {
    const { container } = render(<BillVideoPlayer video={video} />);

    expect(screen.getByText("党内議論 第1回")).toBeInTheDocument();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://i.ytimg.com/vi/bvAnJyl9IDI/hqdefault.jpg"
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("YouTube の視聴ページへのリンクを別タブで開く形で出す", () => {
    render(<BillVideoPlayer video={video} />);

    const link = screen.getByRole("link", { name: "YouTubeで見る" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=bvAnJyl9IDI"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("再生ボタンを押すと youtube-nocookie のプレイヤーに切り替わる", () => {
    const { container } = render(<BillVideoPlayer video={video} />);

    fireEvent.click(
      screen.getByRole("button", { name: "動画を再生: 党内議論 第1回" })
    );

    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/bvAnJyl9IDI?autoplay=1&rel=0"
    );
    expect(iframe).toHaveAttribute("title", "党内議論 第1回");
    expect(screen.queryByRole("button", { name: /動画を再生/ })).toBeNull();
  });
});
