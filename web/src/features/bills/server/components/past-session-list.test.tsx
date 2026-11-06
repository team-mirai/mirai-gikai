// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SluggedDietSession } from "@/features/diet-sessions/shared/types";
import { PastSessionList } from "./past-session-list";

const session = (
  overrides: Partial<SluggedDietSession> = {}
): SluggedDietSession => ({
  id: "s220",
  name: "第220回臨時国会",
  slug: "220-rinji",
  shugiin_url: null,
  start_date: "2025-10-24",
  end_date: "2025-12-17",
  is_active: false,
  created_at: "2025-10-01T00:00:00Z",
  updated_at: "2025-10-01T00:00:00Z",
  ...overrides,
});

describe("PastSessionList", () => {
  it("会期ごとに名前・期間・件数を出し、会期の議案一覧へリンクする", () => {
    render(
      <PastSessionList
        sessions={[
          { session: session(), billCount: 23 },
          {
            session: session({
              id: "s219",
              name: "第219回臨時国会",
              slug: "219-rinji",
              start_date: "2025-08-01",
              end_date: "2025-08-05",
            }),
            billCount: 4,
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "過去の会期一覧" })
    ).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/kokkai/220-rinji/bills");
    expect(links[0]).toHaveTextContent("2025年 第220回臨時国会");
    expect(links[0]).toHaveTextContent("2025.10.24〜12.17");
    expect(links[0]).toHaveTextContent("23件");
    expect(links[1]).toHaveAttribute("href", "/kokkai/219-rinji/bills");
  });

  it("会期がなければ何も出さない", () => {
    const { container } = render(<PastSessionList sessions={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
