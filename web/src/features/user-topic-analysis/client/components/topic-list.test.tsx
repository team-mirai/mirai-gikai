// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { PublicTopic } from "../../shared/types";
import { TopicList } from "./topic-list";

const topics: PublicTopic[] = [
  {
    id: "citizen-topic",
    title: "市民向けの論点",
    description: "市民の意見を含むトピック",
    opinion_count: 2,
    affected_count: 0,
    industry_count: 0,
    expert_count: 0,
    citizen_count: 2,
    sentiment: { 期待: 2, 懸念: 0 },
    opinions: [],
  },
  {
    id: "expert-topic",
    title: "専門家向けの論点",
    description: "専門家の意見を含むトピック",
    opinion_count: 1,
    affected_count: 0,
    industry_count: 0,
    expert_count: 1,
    citizen_count: 0,
    sentiment: { 期待: 0, 懸念: 1 },
    opinions: [],
  },
];

beforeEach(() => {
  sessionStorage.clear();
});

describe("TopicList", () => {
  it("絞り込み後のトピック件数をstatusとして通知する", async () => {
    const user = userEvent.setup();
    render(
      <TopicList billId="bill-id" topics={topics} publicReportCount={1} />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("2件のトピック（3件の意見まとめ）");

    await user.click(screen.getByRole("button", { name: "市民" }));

    expect(status).toHaveTextContent("1件のトピック（2件の意見まとめ）");
    expect(screen.getByText("市民向けの論点")).toBeInTheDocument();
    expect(screen.queryByText("専門家向けの論点")).not.toBeInTheDocument();
  });
});
