// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HamburgerMenu } from "./hamburger-menu";

const pushMock = vi.hoisted(() => vi.fn());
const loadMock = vi.hoisted(() => vi.fn());
const usePathnameMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: usePathnameMock,
}));
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
  usePathnameMock.mockReturnValue("/");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

async function openMenu() {
  const user = userEvent.setup();
  const view = render(<HamburgerMenu />);
  await user.click(screen.getByRole("button", { name: "メニューを開く" }));
  return { user, view };
}

/** 応答を返す時点をテスト側で決められる取得。 */
function deferredLoad() {
  let resolve: (value: unknown) => void = () => {};
  loadMock.mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    })
  );
  return () => resolve({ tags, bills });
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
    const { user } = await openMenu();

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
    const { user } = await openMenu();

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
    const { user } = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/bills");
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("先読みに失敗していても、検索を押せば取り直して開く", async () => {
    loadMock.mockRejectedValueOnce(new Error("network"));
    const { user } = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(loadMock).toHaveBeenCalledTimes(2);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("先読みの取得中に検索を押しても取りに行き直さず、その応答で開く", async () => {
    const resolveLoad = deferredLoad();
    const { user } = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    resolveLoad();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(loadMock).toHaveBeenCalledTimes(1);
  });

  // ヘッダーはページをまたいで残るので、待っていた検索が移動先で開かないこと。
  it("中身を待つ間に別のページへ移ったら、届いてもモーダルを開かない", async () => {
    const resolveLoad = deferredLoad();
    const { user, view } = await openMenu();

    await user.click(screen.getByRole("button", { name: "法案を検索" }));
    usePathnameMock.mockReturnValue("/bills/bill-school");
    view.rerender(<HamburgerMenu />);
    resolveLoad();

    // 応答が反映されるまで待ってから、開いていないことを確かめる。
    await waitFor(() => {
      expect(loadMock).toHaveBeenCalledTimes(1);
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
