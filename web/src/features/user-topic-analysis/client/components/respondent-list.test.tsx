// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { PublicRespondent } from "../../shared/types";
import { RespondentList } from "./respondent-list";

const respondents: PublicRespondent[] = [
  {
    id: "expectation-report",
    user_category: "citizen",
    role_title: "市民",
    bill_sentiment: "期待",
    summary: "制度の改善を期待する回答",
    created_at: "2026-08-06T00:00:00.000Z",
  },
  {
    id: "concern-report",
    user_category: "expert",
    role_title: "専門家",
    bill_sentiment: "懸念",
    summary: "運用上の懸念を示す回答",
    created_at: "2026-08-06T00:00:00.000Z",
  },
];

beforeEach(() => {
  sessionStorage.clear();
});

describe("RespondentList", () => {
  it("絞り込み後の回答件数をstatusとして通知する", async () => {
    const user = userEvent.setup();
    render(
      <RespondentList respondents={respondents} nowMs={Date.UTC(2026, 7, 7)} />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("2人のインタビューの回答");

    await user.click(screen.getByRole("button", { name: /期待\s*1人/ }));

    expect(status).toHaveTextContent("1人のインタビューの回答");
    expect(screen.getByText("制度の改善を期待する回答")).toBeInTheDocument();
    expect(
      screen.queryByText("運用上の懸念を示す回答")
    ).not.toBeInTheDocument();
  });
});
