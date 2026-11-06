import { describe, expect, it } from "vitest";
import type { PublicOpinion } from "../types";
import { pickCardQuotes } from "./pick-card-quotes";

function makeOpinion(
  id: string,
  overrides: Partial<PublicOpinion> = {}
): PublicOpinion {
  return {
    id,
    interview_report_id: `r-${id}`,
    report_public: true,
    created_at: null,
    title: `op-${id}`,
    content: "",
    user_category: "citizen",
    role_title: null,
    bill_sentiment: null,
    contextual_quote: null,
    richness: null,
    source_message_id: null,
    question_snippet: null,
    ...overrides,
  };
}

const ids = (opinions: PublicOpinion[]) => opinions.map((o) => o.id);

describe("pickCardQuotes", () => {
  it("同一の引用文は先頭の1件だけ残す", () => {
    const opinions = [
      makeOpinion("a", { contextual_quote: "賛成です" }),
      makeOpinion("b", { contextual_quote: "賛成です" }),
      makeOpinion("c", { contextual_quote: "負担が心配" }),
    ];

    expect(ids(pickCardQuotes(opinions, "all", 3))).toEqual(["a", "c"]);
  });

  it("前後や連続する空白の違いは同一の引用文とみなす", () => {
    const opinions = [
      makeOpinion("a", { contextual_quote: "とても  賛成" }),
      makeOpinion("b", { contextual_quote: " とても 賛成\n" }),
    ];

    expect(ids(pickCardQuotes(opinions, "all", 3))).toEqual(["a"]);
  });

  it("重複を除いた後で最大件数まで埋める", () => {
    const opinions = [
      makeOpinion("a", { contextual_quote: "同じ" }),
      makeOpinion("b", { contextual_quote: "同じ" }),
      makeOpinion("c", { contextual_quote: "別1" }),
      makeOpinion("d", { contextual_quote: "別2" }),
      makeOpinion("e", { contextual_quote: "別3" }),
    ];

    expect(ids(pickCardQuotes(opinions, "all", 3))).toEqual(["a", "c", "d"]);
  });

  it("引用が空・空白のみの意見は除外する", () => {
    const opinions = [
      makeOpinion("a", { contextual_quote: null }),
      makeOpinion("b", { contextual_quote: "   " }),
      makeOpinion("c", { contextual_quote: "有効" }),
    ];

    expect(ids(pickCardQuotes(opinions, "all", 3))).toEqual(["c"]);
  });

  it("フィルタ該当意見の引用を優先する", () => {
    const opinions = [
      makeOpinion("a", { contextual_quote: "市民", user_category: "citizen" }),
      makeOpinion("b", {
        contextual_quote: "専門家",
        user_category: "expert",
      }),
    ];

    expect(ids(pickCardQuotes(opinions, "expert", 3))).toEqual(["b"]);
  });

  it("フィルタ該当の引用が無ければ全体から拾う", () => {
    const opinions = [
      makeOpinion("a", { contextual_quote: "市民", user_category: "citizen" }),
      makeOpinion("b", { contextual_quote: null, user_category: "expert" }),
    ];

    expect(ids(pickCardQuotes(opinions, "expert", 3))).toEqual(["a"]);
  });
});
