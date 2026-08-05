// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderClient } from "./header-client";

const sendGAEventMock = vi.hoisted(() => vi.fn());
const usePathnameMock = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: sendGAEventMock,
}));
vi.mock("next/navigation", () => ({ usePathname: usePathnameMock }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
vi.mock(
  "@/features/bill-difficulty/client/components/difficulty-selector",
  () => ({
    DifficultySelector: () => null,
  })
);
vi.mock(
  "@/features/interview-session/client/components/interview-header-actions",
  () => ({
    InterviewHeaderActions: () => null,
  })
);
vi.mock("./hamburger-menu", () => ({ HamburgerMenu: () => null }));

beforeEach(() => {
  sendGAEventMock.mockClear();
  usePathnameMock.mockReturnValue("/");
});

describe("HeaderClient", () => {
  it("マウント時に難易度設定の現在値をGAへ送る", () => {
    render(<HeaderClient difficultyLevel="hard" />);

    expect(sendGAEventMock).toHaveBeenCalledWith("event", "difficulty_state", {
      level: "hard",
    });
  });

  it("pathnameが変わると再度GAへ送る", () => {
    const { rerender } = render(<HeaderClient difficultyLevel="normal" />);
    expect(sendGAEventMock).toHaveBeenCalledTimes(1);

    usePathnameMock.mockReturnValue("/bills/1");
    rerender(<HeaderClient difficultyLevel="normal" />);

    expect(sendGAEventMock).toHaveBeenCalledTimes(2);
  });
});
