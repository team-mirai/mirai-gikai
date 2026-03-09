import { describe, expect, it } from "vitest";
import {
  opinionClassificationSchema,
  overallSummarySchema,
  topicExtractionSchema,
  topicMergeSchema,
  topicReportSchema,
} from "./schemas";

describe("topicExtractionSchema", () => {
  it("accepts valid topics array", () => {
    const result = topicExtractionSchema.safeParse({
      topics: [{ name: "トピック名" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty topics array", () => {
    const result = topicExtractionSchema.safeParse({
      topics: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing topics field", () => {
    const result = topicExtractionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects topic without name", () => {
    const result = topicExtractionSchema.safeParse({
      topics: [{}],
    });
    expect(result.success).toBe(false);
  });
});

describe("topicMergeSchema", () => {
  it("accepts valid merged_topics", () => {
    const result = topicMergeSchema.safeParse({
      merged_topics: [{ name: "マージ済み", original_names: ["a", "b"] }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty merged_topics array", () => {
    const result = topicMergeSchema.safeParse({
      merged_topics: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing original_names", () => {
    const result = topicMergeSchema.safeParse({
      merged_topics: [{ name: "マージ済み" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = topicMergeSchema.safeParse({
      merged_topics: [{ original_names: ["a"] }],
    });
    expect(result.success).toBe(false);
  });
});

describe("opinionClassificationSchema", () => {
  it("accepts valid classification", () => {
    const result = opinionClassificationSchema.safeParse({
      classifications: [
        {
          interview_report_id: "report-1",
          opinion_index: 0,
          topic_names: ["トピックA", "トピックB"],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty classifications array", () => {
    const result = opinionClassificationSchema.safeParse({
      classifications: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing interview_report_id", () => {
    const result = opinionClassificationSchema.safeParse({
      classifications: [{ opinion_index: 0, topic_names: ["トピックA"] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing opinion_index", () => {
    const result = opinionClassificationSchema.safeParse({
      classifications: [
        {
          interview_report_id: "report-1",
          topic_names: ["トピックA"],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing topic_names", () => {
    const result = opinionClassificationSchema.safeParse({
      classifications: [
        {
          interview_report_id: "report-1",
          opinion_index: 0,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("topicReportSchema", () => {
  it("accepts valid report with all fields", () => {
    const result = topicReportSchema.safeParse({
      description: "# トピック説明\n\n詳細な説明 [ref:1]",
      references: [{ ref_id: 1, session_id: "session-1" }],
      representative_opinions: [
        {
          session_id: "session-1",
          opinion_title: "意見タイトル",
          opinion_content: "意見の内容",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty references and opinions arrays", () => {
    const result = topicReportSchema.safeParse({
      description: "説明文",
      references: [],
      representative_opinions: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts representative_opinions with exactly 5 items", () => {
    const opinions = Array.from({ length: 5 }, (_, i) => ({
      session_id: `session-${i}`,
      opinion_title: `タイトル${i}`,
      opinion_content: `内容${i}`,
    }));
    const result = topicReportSchema.safeParse({
      description: "説明文",
      references: [],
      representative_opinions: opinions,
    });
    expect(result.success).toBe(true);
  });

  it("rejects representative_opinions with more than 5 items", () => {
    const opinions = Array.from({ length: 6 }, (_, i) => ({
      session_id: `session-${i}`,
      opinion_title: `タイトル${i}`,
      opinion_content: `内容${i}`,
    }));
    const result = topicReportSchema.safeParse({
      description: "説明文",
      references: [],
      representative_opinions: opinions,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = topicReportSchema.safeParse({
      references: [],
      representative_opinions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing references", () => {
    const result = topicReportSchema.safeParse({
      description: "説明文",
      representative_opinions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing representative_opinions", () => {
    const result = topicReportSchema.safeParse({
      description: "説明文",
      references: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("overallSummarySchema", () => {
  it("accepts valid summary", () => {
    const result = overallSummarySchema.safeParse({
      summary: "サマリテキスト",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing summary", () => {
    const result = overallSummarySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string summary", () => {
    const result = overallSummarySchema.safeParse({
      summary: 123,
    });
    expect(result.success).toBe(false);
  });
});
