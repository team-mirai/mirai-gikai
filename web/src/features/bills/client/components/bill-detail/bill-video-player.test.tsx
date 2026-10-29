// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillVideoPlayer } from "./bill-video-player";

const video = {
  id: "video-1",
  kind: "stance_decision" as const,
  youtube_video_id: "bvAnJyl9IDI",
  title: "解説動画 第1回",
};

describe("BillVideoPlayer", () => {
  it("初期表示ではサムネイルとタイトルのみを出し、プレイヤーは読み込まない", () => {
    const { container } = render(<BillVideoPlayer video={video} />);

    expect(screen.getByText("解説動画 第1回")).toBeInTheDocument();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://i.ytimg.com/vi/bvAnJyl9IDI/hq720.jpg"
    );
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("高解像度サムネイルの読み込みに失敗したら hqdefault に切り替える", () => {
    const { container } = render(<BillVideoPlayer video={video} />);
    const img = container.querySelector("img") as HTMLImageElement;

    fireEvent.error(img);

    expect(img).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/bvAnJyl9IDI/hqdefault.jpg"
    );
  });

  it("YouTube のプレースホルダー画像が返ってきたら hqdefault に切り替える", async () => {
    const { container } = render(<BillVideoPlayer video={video} />);
    const img = container.querySelector("img") as HTMLImageElement;

    Object.defineProperty(img, "naturalWidth", { value: 120 });
    fireEvent.load(img);

    // next/image は画像のデコード完了後に onLoad を呼ぶため非同期で待つ
    await waitFor(() =>
      expect(img).toHaveAttribute(
        "src",
        "https://i.ytimg.com/vi/bvAnJyl9IDI/hqdefault.jpg"
      )
    );
  });

  it("高解像度サムネイルが読み込めたらそのまま表示する", async () => {
    const { container } = render(<BillVideoPlayer video={video} />);
    const img = container.querySelector("img") as HTMLImageElement;

    Object.defineProperty(img, "naturalWidth", { value: 1280 });
    // onLoad の非同期処理が終わるまで待ってから判定する
    await act(async () => {
      fireEvent.load(img);
    });

    expect(img).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/bvAnJyl9IDI/hq720.jpg"
    );
  });

  it("YouTube の視聴ページを別タブで開くアイコンリンクを出す", () => {
    render(<BillVideoPlayer video={video} />);

    const link = screen.getByRole("link", {
      name: "YouTubeで開く: 解説動画 第1回",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=bvAnJyl9IDI"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("再生ボタンを押すと youtube-nocookie のプレイヤーに切り替わる", () => {
    const { container } = render(<BillVideoPlayer video={video} />);

    fireEvent.click(
      screen.getByRole("button", { name: "動画を再生: 解説動画 第1回" })
    );

    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/bvAnJyl9IDI?autoplay=1&rel=0"
    );
    expect(iframe).toHaveAttribute("title", "解説動画 第1回");
    expect(screen.queryByRole("button", { name: /動画を再生/ })).toBeNull();
  });
});
