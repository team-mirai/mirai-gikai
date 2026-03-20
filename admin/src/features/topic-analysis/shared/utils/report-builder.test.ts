import { describe, expect, it } from "vitest";
import type {
  RepresentativeOpinion,
  TopicAnalysisTopic,
  TopicAnalysisVersion,
} from "../types";
import { buildReportMarkdown, buildToc, toSlug } from "./report-builder";

// ---------------------------------------------------------------------------
// Helpers to build minimal mock objects
// ---------------------------------------------------------------------------

function makeVersion(
  overrides: Partial<TopicAnalysisVersion> = {}
): TopicAnalysisVersion {
  return {
    id: "ver-1",
    bill_id: "bill-1",
    version: 1,
    status: "completed",
    summary_md: null,
    current_step: null,
    error_message: null,
    intermediate_results: null,
    phase_data: null,
    started_at: null,
    completed_at: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeTopic(
  overrides: Partial<TopicAnalysisTopic> = {}
): TopicAnalysisTopic {
  return {
    id: "topic-1",
    version_id: "ver-1",
    name: "テスト話題",
    description_md: "テスト説明文",
    representative_opinions: [],
    sort_order: 0,
    created_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// toSlug
// ---------------------------------------------------------------------------

describe("toSlug", () => {
  it("converts Japanese text to a slug", () => {
    expect(toSlug("全体サマリ")).toBe("全体サマリ");
  });

  it("converts mixed text with numbers", () => {
    expect(toSlug("トピック1. テスト名")).toBe("トピック1-テスト名");
  });

  it("handles special characters", () => {
    expect(toSlug("Hello, World! (test)")).toBe("hello-world-test");
  });

  it("returns empty string for empty input", () => {
    expect(toSlug("")).toBe("");
  });

  it("strips leading and trailing dashes", () => {
    expect(toSlug("---test---")).toBe("test");
  });
});

// ---------------------------------------------------------------------------
// buildToc
// ---------------------------------------------------------------------------

describe("buildToc", () => {
  it("builds TOC with summary and topics", () => {
    const topics = [{ name: "交通" }, { name: "環境" }];
    const result = buildToc(true, topics);

    expect(result).toEqual([
      { id: "全体サマリ", label: "全体サマリ" },
      { id: "トピック1-交通", label: "トピック1. 交通" },
      { id: "トピック2-環境", label: "トピック2. 環境" },
    ]);
  });

  it("builds TOC without summary", () => {
    const topics = [{ name: "交通" }];
    const result = buildToc(false, topics);

    expect(result).toEqual([
      { id: "トピック1-交通", label: "トピック1. 交通" },
    ]);
  });

  it("returns empty array when no summary and no topics", () => {
    expect(buildToc(false, [])).toEqual([]);
  });

  it("returns only summary entry when topics is empty", () => {
    expect(buildToc(true, [])).toEqual([
      { id: "全体サマリ", label: "全体サマリ" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// buildReportMarkdown
// ---------------------------------------------------------------------------

describe("buildReportMarkdown", () => {
  it("builds markdown with summary and topics with representatives", () => {
    const opinions: RepresentativeOpinion[] = [
      {
        session_id: "s1",
        opinion_title: "賛成意見",
        opinion_content: "内容A",
        ref_id: 1,
      },
    ];
    const version = makeVersion({ summary_md: "サマリ本文" });
    const topics = [
      makeTopic({
        name: "交通",
        description_md: "交通の説明",
        representative_opinions: opinions,
      }),
    ];

    const md = buildReportMarkdown(version, topics);

    expect(md).toContain("# 全体サマリ");
    expect(md).toContain("サマリ本文");
    expect(md).toContain("## トピック1. 交通");
    expect(md).toContain("交通の説明");
    expect(md).toContain("### 代表的な意見");
    expect(md).toContain("**賛成意見**");
    expect(md).toContain("（インタビュー#1）");
    expect(md).toContain("内容A");
  });

  it("builds markdown without summary", () => {
    const version = makeVersion({ summary_md: null });
    const topics = [makeTopic({ name: "環境", description_md: "環境の説明" })];

    const md = buildReportMarkdown(version, topics);

    expect(md).not.toContain("# 全体サマリ");
    expect(md).toContain("## トピック1. 環境");
  });

  it("handles topics without representative_opinions", () => {
    const version = makeVersion({ summary_md: null });
    const topics = [
      makeTopic({
        name: "教育",
        description_md: "教育の説明",
        representative_opinions: [],
      }),
    ];

    const md = buildReportMarkdown(version, topics);

    expect(md).toContain("## トピック1. 教育");
    expect(md).toContain("教育の説明");
    expect(md).not.toContain("### 代表的な意見");
  });

  it("shows ref label when ref_id is present", () => {
    const opinions: RepresentativeOpinion[] = [
      {
        session_id: "s1",
        opinion_title: "意見タイトル",
        opinion_content: "意見内容",
        ref_id: 5,
      },
    ];
    const version = makeVersion();
    const topics = [makeTopic({ representative_opinions: opinions })];

    const md = buildReportMarkdown(version, topics);

    expect(md).toContain("（インタビュー#5）");
  });

  it("omits ref label when ref_id is null", () => {
    const opinions: RepresentativeOpinion[] = [
      {
        session_id: "s1",
        opinion_title: "意見タイトル",
        opinion_content: "意見内容",
        ref_id: null,
      },
    ];
    const version = makeVersion();
    const topics = [makeTopic({ representative_opinions: opinions })];

    const md = buildReportMarkdown(version, topics);

    expect(md).not.toContain("インタビュー#");
  });

  it("uses source_message_content over opinion_content when available", () => {
    const opinions: RepresentativeOpinion[] = [
      {
        session_id: "s1",
        opinion_title: "タイトル",
        opinion_content: "元の内容",
        source_message_content: "ソースの内容",
      },
    ];
    const version = makeVersion();
    const topics = [makeTopic({ representative_opinions: opinions })];

    const md = buildReportMarkdown(version, topics);

    expect(md).toContain("ソースの内容");
    expect(md).not.toContain("元の内容");
  });

  it("falls back to opinion_content when source_message_content is null", () => {
    const opinions: RepresentativeOpinion[] = [
      {
        session_id: "s1",
        opinion_title: "タイトル",
        opinion_content: "フォールバック内容",
        source_message_content: null,
      },
    ];
    const version = makeVersion();
    const topics = [makeTopic({ representative_opinions: opinions })];

    const md = buildReportMarkdown(version, topics);

    expect(md).toContain("フォールバック内容");
  });

  it("returns empty string when no summary and no topics", () => {
    const version = makeVersion({ summary_md: null });
    expect(buildReportMarkdown(version, [])).toBe("");
  });
});
