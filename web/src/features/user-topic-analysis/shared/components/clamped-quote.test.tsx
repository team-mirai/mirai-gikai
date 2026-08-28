// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { clampQuote } from "../utils/clamp-quote";
import { ClampedQuote, QUOTE_CAPACITY } from "./clamped-quote";

/** 狭い側の予算には収まらず、広い側の予算には収まる長さ。 */
const MEDIUM_QUOTE = "あ".repeat(QUOTE_CAPACITY.narrow + 20);
/** どちらの予算にも収まらない長さ。 */
const LONG_QUOTE = "あ".repeat(QUOTE_CAPACITY.wide + 50);

const SHORT_QUOTE = "エンジンや、安全性";

const narrowVariant = (container: HTMLElement) =>
  container.querySelector(".md\\:hidden");
const wideVariant = (container: HTMLElement) =>
  container.querySelector(".hidden.md\\:inline");

describe("ClampedQuote", () => {
  it("短い引用は全文と肩書を出す", () => {
    render(<ClampedQuote quote={SHORT_QUOTE} attribution="市民" />);

    expect(screen.getAllByText(SHORT_QUOTE)).toHaveLength(2);
    expect(screen.getByText("市民")).toBeInTheDocument();
  });

  it("短い引用には「…」を付けない", () => {
    const { container } = render(
      <ClampedQuote quote={SHORT_QUOTE} attribution="市民" />
    );

    expect(container.textContent).not.toContain("…");
  });

  it("収まらない引用は切り詰めて「…」を付ける", () => {
    const { container } = render(
      <ClampedQuote quote={LONG_QUOTE} attribution="市民" />
    );

    expect(container.textContent).toContain("…");
    expect(container.textContent).not.toContain(LONG_QUOTE);
  });

  it("切り詰めても肩書は必ず出す", () => {
    render(<ClampedQuote quote={LONG_QUOTE} attribution="衛星研究者" />);

    expect(screen.getByText("衛星研究者")).toBeInTheDocument();
  });

  it("画面幅で結果が変わる引用は狭い側と広い側の両方を描く", () => {
    const { container } = render(
      <ClampedQuote quote={MEDIUM_QUOTE} attribution="市民" />
    );

    expect(narrowVariant(container)).toBeInTheDocument();
    expect(wideVariant(container)).toBeInTheDocument();
  });

  // 狭い側と広い側を取り違えると、スマホに長い方が出て溢れる。
  // 要素の有無だけでは入れ替えを検出できないので中身で判定する。
  it("狭い側だけを切り詰め、広い側は全文を出す", () => {
    const { container } = render(
      <ClampedQuote quote={MEDIUM_QUOTE} attribution="市民" />
    );

    expect(narrowVariant(container)?.textContent).toContain("…");
    expect(wideVariant(container)?.textContent).not.toContain("…");
  });

  it("狭い側の本文は広い側の本文の先頭部分になる", () => {
    const { container } = render(
      <ClampedQuote quote={LONG_QUOTE} attribution="市民" />
    );
    const narrow = narrowVariant(container)?.textContent?.replace("…", "");
    const wide = wideVariant(container)?.textContent?.replace("…", "");

    expect(narrow).toBeTruthy();
    expect(wide?.startsWith(narrow ?? "")).toBe(true);
    expect(wide?.length).toBeGreaterThan(narrow?.length ?? 0);
  });

  it("画面幅で結果が変わらない引用も一定のラッパー構造で描く", () => {
    const { container } = render(
      <ClampedQuote quote={SHORT_QUOTE} attribution="市民" />
    );

    expect(narrowVariant(container)).toBeInTheDocument();
    expect(wideVariant(container)).toBeInTheDocument();
  });

  it("両方を描くときも肩書は重複させない", () => {
    render(<ClampedQuote quote={MEDIUM_QUOTE} attribution="市民" />);

    expect(screen.getAllByText("市民")).toHaveLength(1);
  });

  // rubyful が innerHTML を差し替えた後に React が子要素を出し入れすると
  // removeChild に失敗してページごと落ちる。「…」を別ノードにしないことで防ぐ。
  it("「…」を本文と同じテキストノードに入れる", () => {
    const { container } = render(
      <ClampedQuote quote={LONG_QUOTE} attribution="市民" />
    );
    const body = container.querySelector(".md\\:hidden .hover\\:underline");

    expect(body?.childNodes).toHaveLength(1);
    expect(body?.textContent?.endsWith("…")).toBe(true);
  });

  // マウント後に DOM 構造が変わらないことが、この修正の肝。
  it("同じ props で再描画しても DOM が変わらない", () => {
    const { container, rerender } = render(
      <ClampedQuote quote={LONG_QUOTE} attribution="市民" />
    );
    const before = container.innerHTML;

    rerender(<ClampedQuote quote={LONG_QUOTE} attribution="市民" />);

    expect(container.innerHTML).toBe(before);
  });

  it("rubyful が DOM を置換した後に表示幅の結果が変わっても例外にならない", () => {
    const { container, rerender } = render(
      <ClampedQuote quote={SHORT_QUOTE} attribution="市民" />
    );
    const root = container.firstElementChild;
    if (!root) throw new Error("ClampedQuote root was not rendered");

    // Rubyful は対象要素の innerHTML を再代入し、React が保持するノードを外す。
    const rubyfulHtml = root.innerHTML;
    root.innerHTML = rubyfulHtml;

    expect(() =>
      rerender(<ClampedQuote quote={LONG_QUOTE} attribution="市民" />)
    ).not.toThrow();

    const narrow = clampQuote(LONG_QUOTE, "市民", QUOTE_CAPACITY.narrow);
    const wide = clampQuote(LONG_QUOTE, "市民", QUOTE_CAPACITY.wide);

    expect(narrowVariant(container)?.textContent).toBe(`${narrow.text}…`);
    expect(wideVariant(container)?.textContent).toBe(`${wide.text}…`);
    expect(container).not.toHaveTextContent(SHORT_QUOTE);
  });
});
