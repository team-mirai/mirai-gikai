// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { PublicOpinion } from "../../shared/types";
import { TopicOpinionList } from "./topic-opinion-list";

const opinions: PublicOpinion[] = [
  {
    id: "expectation-opinion",
    interview_report_id: "expectation-report",
    report_public: true,
    created_at: "2026-08-06T00:00:00.000Z",
    title: "期待する意見",
    content: "制度の改善を期待しています",
    user_category: "citizen",
    role_title: "市民",
    bill_sentiment: "期待",
    contextual_quote: null,
    richness: null,
    source_message_id: null,
    question_snippet: null,
  },
  {
    id: "concern-opinion",
    interview_report_id: "concern-report",
    report_public: true,
    created_at: "2026-08-06T00:00:00.000Z",
    title: "懸念する意見",
    content: "制度の運用を懸念しています",
    user_category: "expert",
    role_title: "専門家",
    bill_sentiment: "懸念",
    contextual_quote: null,
    richness: null,
    source_message_id: null,
    question_snippet: null,
  },
];

beforeEach(() => {
  sessionStorage.clear();
});

describe("TopicOpinionList", () => {
  it("絞り込み後の意見件数をstatusとして通知する", async () => {
    const user = userEvent.setup();
    render(
      <TopicOpinionList
        opinions={opinions}
        publicReportCount={2}
        nowMs={Date.UTC(2026, 7, 7)}
      />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("2件の意見");

    await user.click(screen.getByRole("button", { name: /期待\s*1/ }));

    expect(status).toHaveTextContent("1件の意見");
    expect(
      screen.getByRole("heading", { name: "期待する意見" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "懸念する意見" })
    ).not.toBeInTheDocument();
  });
});
