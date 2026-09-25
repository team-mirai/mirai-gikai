import { describe, expect, it } from "vitest";
import { shouldShowFullBillCard } from "./should-show-full-bill-card";

describe("shouldShowFullBillCard", () => {
  it("先頭の議案はインタビューが無くてもフルカードにする", () => {
    expect(shouldShowFullBillCard({ hasPublicInterview: false }, 0)).toBe(true);
  });

  it("2件目以降でもAIインタビュー受付中ならフルカードにする", () => {
    expect(shouldShowFullBillCard({ hasPublicInterview: true }, 1)).toBe(true);
  });

  it("2件目以降でインタビューが無ければコンパクトにする", () => {
    expect(shouldShowFullBillCard({ hasPublicInterview: false }, 1)).toBe(
      false
    );
  });

  it("hasPublicInterview が未設定ならインタビュー無しとして扱う", () => {
    expect(shouldShowFullBillCard({}, 2)).toBe(false);
  });
});
