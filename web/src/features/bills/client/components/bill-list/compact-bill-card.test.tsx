// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createMockBill,
  createMockBillContent,
} from "@/app/dev/_lib/mock-data";
import { CompactBillCard } from "./compact-bill-card";

/** 日付の行だけを狙う。行全体に一致させて、ステータスバッジの文言と混ざらないようにする。 */
const DATE_LINE = /^\d{4}\.\d+\.\d+ (提出|成立)$/;

describe("CompactBillCard", () => {
  it("わかりやすいタイトルがあればそれを見出しにする", () => {
    render(
      <CompactBillCard
        bill={createMockBill({
          bill_content: createMockBillContent({
            title: "給食を無償にする法案",
          }),
        })}
      />
    );

    expect(
      screen.getByRole("heading", { name: /給食を無償にする法案/ })
    ).toBeInTheDocument();
  });

  /*
    カードの取得は bill_contents!inner なので、この経路は通常は通らない。
    フォールバックが消えたときに見出しが空になるのを防ぐための保険。
  */
  it("タイトルが無ければ正式名称を見出しにする", () => {
    render(
      <CompactBillCard
        bill={createMockBill({
          name: "学校給食法の一部を改正する法律案",
          bill_content: undefined,
          is_review_completed: false,
        })}
      />
    );

    expect(
      screen.getByRole("heading", { name: "学校給食法の一部を改正する法律案" })
    ).toBeInTheDocument();
  });

  it("レビュー完了のときだけ完了バッジを添える", () => {
    const { rerender } = render(
      <CompactBillCard bill={createMockBill({ is_review_completed: false })} />
    );
    expect(
      screen.queryByRole("img", { name: "レビュー完了" })
    ).not.toBeInTheDocument();

    rerender(
      <CompactBillCard bill={createMockBill({ is_review_completed: true })} />
    );
    expect(
      screen.getByRole("img", { name: "レビュー完了" })
    ).toBeInTheDocument();
  });

  it("成立済みの日付には「成立」を添える", () => {
    render(
      <CompactBillCard
        bill={createMockBill({
          status: "enacted",
          submitted_date: "2026-02-03",
        })}
      />
    );

    expect(screen.getByText(DATE_LINE)).toHaveTextContent("2026.2.3 成立");
  });

  it("成立していなければ「提出」を添える", () => {
    render(
      <CompactBillCard
        bill={createMockBill({
          status: "introduced",
          submitted_date: "2026-02-03",
        })}
      />
    );

    expect(screen.getByText(DATE_LINE)).toHaveTextContent("2026.2.3 提出");
  });

  // 成立済みでも日付が無いことはある。バッジの「法案成立」と取り違えない。
  it("日付が無ければ日付の行を出さない", () => {
    render(
      <CompactBillCard
        bill={createMockBill({ status: "enacted", submitted_date: null })}
      />
    );

    expect(screen.queryByText(DATE_LINE)).not.toBeInTheDocument();
  });

  // staging で多くの議案がサムネイル未設定だった。無い側も崩れずに出る必要がある。
  it("サムネイルが未設定なら画像を出さない", () => {
    render(
      <CompactBillCard
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
      <CompactBillCard
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
});
