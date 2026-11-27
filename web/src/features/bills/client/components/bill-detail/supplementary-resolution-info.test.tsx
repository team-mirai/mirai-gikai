// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { SupplementaryResolutionInfo } from "./supplementary-resolution-info";

// jsdom には ResizeObserver が無く、Radix Tooltip の配置計算で必要になる
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("SupplementaryResolutionInfo", () => {
  it("タップ（クリック）すると説明が開いたままになる", async () => {
    render(<SupplementaryResolutionInfo />);

    fireEvent.click(screen.getByRole("button", { name: "附帯決議とは" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "委員会が政府に求める決議です"
    );
  });
});
