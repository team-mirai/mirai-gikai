// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RubyfulInitializer } from "./initializer";

const sendGAEventMock = vi.hoisted(() => vi.fn());

vi.mock("@next/third-parties/google", () => ({
  sendGAEvent: sendGAEventMock,
}));
vi.mock("next/script", () => ({
  default: () => null,
}));

beforeEach(() => {
  localStorage.clear();
  sendGAEventMock.mockClear();
});

describe("RubyfulInitializer", () => {
  it("マウント時にふりがな表示の現在値をGAへ送る", () => {
    localStorage.setItem("rubyful-enabled", "true");
    render(<RubyfulInitializer />);

    expect(sendGAEventMock).toHaveBeenCalledWith("event", "furigana_state", {
      enabled: true,
    });
  });

  it("localStorage未設定時はfalseで送る", () => {
    render(<RubyfulInitializer />);

    expect(sendGAEventMock).toHaveBeenCalledWith("event", "furigana_state", {
      enabled: false,
    });
  });
});
