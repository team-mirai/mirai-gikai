import { describe, expect, it } from "vitest";
import { buildInterviewOpinionRows } from "./build-interview-opinion-rows";

const REPORT_ID = "11111111-1111-1111-1111-111111111111";

describe("buildInterviewOpinionRows", () => {
  it("意見配列を opinion_index 付きの行に変換する", () => {
    const rows = buildInterviewOpinionRows(REPORT_ID, [
      {
        title: "賛成の理由",
        content: "社会全体の利益になる",
        source_message_id: "msg-1",
        contextual_quote: "（法案について）賛成です",
        bill_sentiment: "期待",
      },
      {
        title: "懸念点",
        content: "コストが心配",
        source_message_id: "msg-2",
        contextual_quote: null,
        bill_sentiment: "懸念",
      },
    ]);

    expect(rows).toEqual([
      {
        interview_report_id: REPORT_ID,
        opinion_index: 0,
        title: "賛成の理由",
        content: "社会全体の利益になる",
        source_message_id: "msg-1",
        contextual_quote: "（法案について）賛成です",
        bill_sentiment: "期待",
      },
      {
        interview_report_id: REPORT_ID,
        opinion_index: 1,
        title: "懸念点",
        content: "コストが心配",
        source_message_id: "msg-2",
        contextual_quote: null,
        bill_sentiment: "懸念",
      },
    ]);
  });

  it("新フィールドが無い旧データは null で補完する", () => {
    const rows = buildInterviewOpinionRows(REPORT_ID, [
      { title: "意見", content: "内容", source_message_id: null },
    ]);

    expect(rows[0]).toEqual({
      interview_report_id: REPORT_ID,
      opinion_index: 0,
      title: "意見",
      content: "内容",
      source_message_id: null,
      contextual_quote: null,
      bill_sentiment: null,
    });
  });

  it("source_message_id が未指定でも null に倒す", () => {
    const rows = buildInterviewOpinionRows(REPORT_ID, [
      { title: "意見", content: "内容" },
    ]);

    expect(rows[0].source_message_id).toBeNull();
  });

  it("空配列なら空配列を返す", () => {
    expect(buildInterviewOpinionRows(REPORT_ID, [])).toEqual([]);
  });
});
