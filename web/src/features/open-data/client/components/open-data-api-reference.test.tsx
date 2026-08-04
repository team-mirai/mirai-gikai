// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OpenDataApiReference } from "./open-data-api-reference";

// Scalar本体はブラウザ前提の重量級ライブラリのため、設定の受け渡しのみを検証する
vi.mock("@scalar/api-reference-react", () => ({
  ApiReferenceReact: ({
    configuration,
  }: {
    configuration: Record<string, unknown>;
  }) => (
    <div data-testid="api-reference" data-url={String(configuration.url)} />
  ),
}));
vi.mock("@scalar/api-reference-react/style.css", () => ({}));

describe("OpenDataApiReference", () => {
  it("OpenAPI仕様書のURLを指定してビューアを表示する", () => {
    render(<OpenDataApiReference />);

    expect(screen.getByTestId("api-reference")).toHaveAttribute(
      "data-url",
      "/openapi/open-data-api.json"
    );
  });
});
