// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HamburgerMenu } from "./hamburger-menu";

const pushMock = vi.hoisted(() => vi.fn());
const loadMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
// Server Action はブラウザから見ると通信なので、届く中身だけを差し替える。
vi.mock("@/features/bills/server/actions/load-bill-search-data", () => ({
  loadBillSearchData: loadMock,
}));

const tags = [{ id: "kurashi", label: "暮らし", count: 8 }];
const bills = [
  {
    id: "bill-school",
    name: "学校給食法の一部を改正する法律案",
    bill_content: { title: "給食を無償にする法案" },
    tags: [{ id: "kurashi", label: "暮らし" }],
  },
];

beforeEach(() => {
  pushMock.mockClear();
  loadMock.mockReset();
  loadMock.mockResolvedValue({ tags, bills });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

async function openMenu() {
  const user = userEvent.setup();
  render(<HamburgerMenu />);
  await user.click(screen.getByRole("button", { name: "メニューを開く" }));
  return user;
}

describe("HamburgerMenu", () => {
  it("メニューに検索とふりがな切り替えを並べる", async () => {
    await openMenu();

    expect(
      screen.getByRole("button", { name: "法案を検索" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "ふりがな表示の切り替え" })
    ).toBeInTheDocument();
  });

  it("検索を選ぶとメニューを閉じて検索モーダルを開く", async () => {
    const user = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));

    expect(await screen.findByRole("dialog")).toHaveAccessibleDescription(
      "キーワードやテーマから法案を探せます。"
    );
    expect(screen.getByRole("link", { name: /暮らし/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("searchbox")).toHaveFocus();
    });
    expect(
      screen.queryByRole("switch", { name: "ふりがな表示の切り替え" })
    ).not.toBeInTheDocument();
  });

  it("モーダルを閉じるとメニューのボタンへフォーカスを戻す", async () => {
    const user = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));
    await user.click(await screen.findByRole("button", { name: "閉じる" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "メニューを開く" })
    ).toHaveFocus();
  });

  // 中身が取れないまま何も起きないと、押しても反応しない入口になる。
  it("中身を取れなければ検索欄のある一覧ページへ移る", async () => {
    loadMock.mockRejectedValue(new Error("network"));
    const user = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/bills");
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("先読みに失敗していても、検索を押せば取り直して開く", async () => {
    loadMock.mockRejectedValueOnce(new Error("network"));
    const user = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(loadMock).toHaveBeenCalledTimes(2);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
