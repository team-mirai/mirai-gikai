// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInScira,
  OpenInT3,
  OpenInTrigger,
  OpenInv0,
} from "./open-in-chat";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
});

const renderOpenDropdown = (query: string) => {
  return render(
    <OpenIn defaultOpen query={query}>
      <OpenInTrigger />
      <OpenInContent>
        <OpenInChatGPT />
        <OpenInClaude />
        <OpenInScira />
        <OpenInT3 />
        <OpenInv0 />
      </OpenInContent>
    </OpenIn>
  );
};

describe("OpenIn", () => {
  describe("OpenInTrigger", () => {
    it("デフォルトのボタンテキストを表示する", () => {
      render(
        <OpenIn query="test">
          <OpenInTrigger />
        </OpenIn>
      );
      expect(screen.getByRole("button")).toHaveTextContent("Open in chat");
    });

    it("カスタム子要素を表示する", () => {
      render(
        <OpenIn query="test">
          <OpenInTrigger>
            <button type="button">カスタムトリガー</button>
          </OpenInTrigger>
        </OpenIn>
      );
      expect(screen.getByText("カスタムトリガー")).toBeInTheDocument();
    });
  });

  describe("ドロップダウン開閉", () => {
    it("defaultOpenでメニュー項目が表示される", async () => {
      renderOpenDropdown("test query");

      await waitFor(() => {
        expect(screen.getByText("Open in ChatGPT")).toBeInTheDocument();
      });
      expect(screen.getByText("Open in Claude")).toBeInTheDocument();
      expect(screen.getByText("Open in Scira")).toBeInTheDocument();
      expect(screen.getByText("Open in T3 Chat")).toBeInTheDocument();
      expect(screen.getByText("Open in V0")).toBeInTheDocument();
    });

    it("トリガーをクリックするとメニューが開く", async () => {
      const user = userEvent.setup();
      render(
        <OpenIn query="test query">
          <OpenInTrigger />
          <OpenInContent>
            <OpenInChatGPT />
            <OpenInClaude />
          </OpenInContent>
        </OpenIn>
      );

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Open in ChatGPT")).toBeInTheDocument();
      });
      expect(screen.getByText("Open in Claude")).toBeInTheDocument();
    });
  });

  describe("プロバイダURL生成", () => {
    it("ChatGPTリンクが正しいURLを持つ", async () => {
      renderOpenDropdown("test query");

      await waitFor(() => {
        expect(screen.getByText("Open in ChatGPT")).toBeInTheDocument();
      });

      const link = screen.getByText("Open in ChatGPT").closest("a");
      const href = link?.getAttribute("href") ?? "";
      expect(href).toContain("chatgpt.com");
      expect(href).toContain("q=test+query");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("Claudeリンクが正しいURLを持つ", async () => {
      renderOpenDropdown("test query");

      await waitFor(() => {
        expect(screen.getByText("Open in Claude")).toBeInTheDocument();
      });

      const link = screen.getByText("Open in Claude").closest("a");
      const href = link?.getAttribute("href") ?? "";
      expect(href).toContain("claude.ai");
      expect(href).toContain("q=test+query");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("Sciraリンクが正しいURLを持つ", async () => {
      renderOpenDropdown("test query");

      await waitFor(() => {
        expect(screen.getByText("Open in Scira")).toBeInTheDocument();
      });

      const link = screen.getByText("Open in Scira").closest("a");
      const href = link?.getAttribute("href") ?? "";
      expect(href).toContain("scira.ai");
      expect(href).toContain("q=test+query");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("T3 Chatリンクが正しいURLを持つ", async () => {
      renderOpenDropdown("test query");

      await waitFor(() => {
        expect(screen.getByText("Open in T3 Chat")).toBeInTheDocument();
      });

      const link = screen.getByText("Open in T3 Chat").closest("a");
      const href = link?.getAttribute("href") ?? "";
      expect(href).toContain("t3.chat");
      expect(href).toContain("q=test+query");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("V0リンクが正しいURLを持つ", async () => {
      renderOpenDropdown("test query");

      await waitFor(() => {
        expect(screen.getByText("Open in V0")).toBeInTheDocument();
      });

      const link = screen.getByText("Open in V0").closest("a");
      const href = link?.getAttribute("href") ?? "";
      expect(href).toContain("v0.app");
      expect(href).toContain("q=test+query");
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  describe("コンテキストエラー", () => {
    it("OpenIn外でプロバイダコンポーネントを使うとエラー", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<OpenInChatGPT />)).toThrow(
        "OpenIn components must be used within an OpenIn provider"
      );
      vi.restoreAllMocks();
    });
  });
});
