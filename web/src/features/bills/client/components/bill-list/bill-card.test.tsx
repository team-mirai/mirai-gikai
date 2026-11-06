// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createMockBill,
  createMockBillContent,
} from "@/app/dev/_lib/mock-data";
import { BillCard } from "./bill-card";

describe("BillCard", () => {
  it("タイトルと概要を出す", () => {
    render(
      <BillCard
        bill={createMockBill({
          bill_content: createMockBillContent({
            title: "ガソリン税を安くする法案",
            summary: "ガソリンにかかる税金を下げる法案です。",
          }),
        })}
      />
    );

    expect(screen.getByText("ガソリン税を安くする法案")).toBeInTheDocument();
    expect(
      screen.getByText("ガソリンにかかる税金を下げる法案です。")
    ).toBeInTheDocument();
  });

  it("注目の議案にだけ注目バッジを出す", () => {
    const { rerender } = render(
      <BillCard bill={createMockBill({ is_featured: false })} />
    );
    expect(screen.queryByText(/注目/)).not.toBeInTheDocument();

    rerender(<BillCard bill={createMockBill({ is_featured: true })} />);
    expect(screen.getByText(/注目/)).toBeInTheDocument();
  });

  // staging で多くの議案がサムネイル未設定だった。無い側も崩れずに出る必要がある。
  it("サムネイルが未設定なら画像を出さない", () => {
    render(
      <BillCard
        bill={createMockBill({
          name: "揮発油税等の暫定税率の廃止等に関する法律案",
          thumbnail_url: null,
        })}
      />
    );

    // レビュー完了バッジも img なので、サムネイルの代替テキストで狙う。
    expect(
      screen.queryByRole("img", {
        name: "揮発油税等の暫定税率の廃止等に関する法律案",
      })
    ).not.toBeInTheDocument();
  });

  it("サムネイルがあれば正式名称を代替テキストにして出す", () => {
    render(
      <BillCard
        bill={createMockBill({
          name: "揮発油税等の暫定税率の廃止等に関する法律案",
          thumbnail_url: "https://example.com/thumb.png",
        })}
      />
    );

    expect(
      screen.getByRole("img", {
        name: "揮発油税等の暫定税率の廃止等に関する法律案",
      })
    ).toBeInTheDocument();
  });

  /*
    サムネイルの有無で注目バッジの配置が absolute と relative に切り替わる。
    切り替え先はクラス名にしか現れないので、ここでは両方が同時に出ることだけを
    見る。重なり方そのものは目で見て確かめる。
  */
  it("サムネイルがあっても注目バッジを出す", () => {
    render(
      <BillCard
        bill={createMockBill({
          name: "揮発油税等の暫定税率の廃止等に関する法律案",
          is_featured: true,
          thumbnail_url: "https://example.com/thumb.png",
        })}
      />
    );

    expect(screen.getByText(/注目/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "揮発油税等の暫定税率の廃止等に関する法律案",
      })
    ).toBeInTheDocument();
  });

  it("紐づくタグをすべて並べる", () => {
    render(
      <BillCard
        bill={createMockBill({
          tags: [
            { id: "zeikin", label: "税金" },
            { id: "kurashi", label: "暮らし" },
          ],
        })}
      />
    );

    expect(screen.getByText("税金")).toBeInTheDocument();
    expect(screen.getByText("暮らし")).toBeInTheDocument();
  });

  it("公開インタビューがあるときだけ受付中を出す", () => {
    const { rerender } = render(
      <BillCard bill={createMockBill({ hasPublicInterview: false })} />
    );
    expect(screen.queryByText("AIインタビュー受付中")).not.toBeInTheDocument();

    rerender(<BillCard bill={createMockBill({ hasPublicInterview: true })} />);
    expect(screen.getByText("AIインタビュー受付中")).toBeInTheDocument();
  });

  it("レビュー完了のときだけ完了バッジを添える", () => {
    const { rerender } = render(
      <BillCard bill={createMockBill({ is_review_completed: false })} />
    );
    expect(
      screen.queryByRole("img", { name: "レビュー完了" })
    ).not.toBeInTheDocument();

    rerender(<BillCard bill={createMockBill({ is_review_completed: true })} />);
    expect(
      screen.getByRole("img", { name: "レビュー完了" })
    ).toBeInTheDocument();
  });

  it("提出日を time 要素で出す", () => {
    const { container } = render(
      <BillCard bill={createMockBill({ submitted_date: "2026-02-03" })} />
    );

    expect(container.querySelector("time")).toHaveTextContent("2026.2.3 提出");
  });

  /*
    日付そのものの有無で見る。文字列で否定すると、同じカードにある
    ステータスバッジの「法案提出前」「法案成立」まで拾ってしまう。
  */
  it("提出日が無ければ日付を出さない", () => {
    const { container } = render(
      <BillCard bill={createMockBill({ submitted_date: null })} />
    );

    expect(container.querySelector("time")).not.toBeInTheDocument();
  });
});
