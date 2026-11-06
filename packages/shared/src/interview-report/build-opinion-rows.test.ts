import { describe, expect, it } from "vitest";
import { buildInterviewOpinionRows } from "./build-opinion-rows";

const REPORT_ID = "11111111-1111-1111-1111-111111111111";
const TAGGED_AT = "2026-08-06T01:00:00.000Z";

describe("buildInterviewOpinionRows", () => {
  it("意見配列を opinion_index 付きの行に変換する", () => {
    const rows = buildInterviewOpinionRows(REPORT_ID, [
      {
        title: "賛成の理由",
        content: "社会全体の利益になる",
        source_message_id: "msg-1",
        contextual_quote: "（法案について）賛成です",
        bill_sentiment: "期待",
        richness: 80,
        concern: null,
        proposal: "審査の基準を先に示してほしい",
        reasoning_types: ["professional_expertise"],
      },
      {
        title: "懸念点",
        content: "コストが心配",
        source_message_id: "msg-2",
        contextual_quote: null,
        bill_sentiment: "懸念",
        richness: 42.6,
        concern: "価格転嫁で負担が増える",
        proposal: null,
        reasoning_types: ["personal_experience", "intuition"],
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
        richness: 80,
        concern: null,
        proposal: "審査の基準を先に示してほしい",
        reasoning_types: ["professional_expertise"],
        tags_extracted_at: null,
      },
      {
        interview_report_id: REPORT_ID,
        opinion_index: 1,
        title: "懸念点",
        content: "コストが心配",
        source_message_id: "msg-2",
        contextual_quote: null,
        bill_sentiment: "懸念",
        // 小数は四捨五入される
        richness: 43,
        concern: "価格転嫁で負担が増える",
        proposal: null,
        reasoning_types: ["personal_experience", "intuition"],
        tags_extracted_at: null,
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
      richness: null,
      concern: null,
      proposal: null,
      reasoning_types: [],
      tags_extracted_at: null,
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

  describe("タグのウォーターマーク", () => {
    // レポート生成と同時にタグも得られる経路（ライブ生成・再抽出）は
    // タグ付け済みとしてマークし、タグ付けバックフィルの対象から外す。
    it("tagsExtractedAtIso を渡すと tags_extracted_at に入る", () => {
      const rows = buildInterviewOpinionRows(
        REPORT_ID,
        [{ title: "意見", content: "内容", reasoning_types: ["none"] }],
        { tagsExtractedAtIso: TAGGED_AT }
      );

      expect(rows[0].tags_extracted_at).toBe(TAGGED_AT);
    });

    it("省略時は未抽出（null）のままにする", () => {
      const rows = buildInterviewOpinionRows(REPORT_ID, [
        { title: "意見", content: "内容" },
      ]);

      expect(rows[0].tags_extracted_at).toBeNull();
    });

    // 新フィールド追加前に生成された要約メッセージから完了したセッションは
    // reasoning_types が null で補完される。ここでウォーターマークを立てると
    // タグ空のまま「抽出済み」になりバックフィルから永久に漏れる。
    it("reasoning_types が無い意見にはウォーターマークを立てない", () => {
      const rows = buildInterviewOpinionRows(
        REPORT_ID,
        [{ title: "意見", content: "内容", reasoning_types: null }],
        { tagsExtractedAtIso: TAGGED_AT }
      );

      expect(rows[0].tags_extracted_at).toBeNull();
    });

    it("同じレポート内でもタグの有無で行ごとに出し分ける", () => {
      const rows = buildInterviewOpinionRows(
        REPORT_ID,
        [
          { title: "旧", content: "内容", reasoning_types: null },
          { title: "新", content: "内容", reasoning_types: ["none"] },
        ],
        { tagsExtractedAtIso: TAGGED_AT }
      );

      expect(rows[0].tags_extracted_at).toBeNull();
      expect(rows[1].tags_extracted_at).toBe(TAGGED_AT);
    });
  });

  describe("reasoning_types の正規化", () => {
    it("null は空配列にする", () => {
      const rows = buildInterviewOpinionRows(REPORT_ID, [
        { title: "意見", content: "内容", reasoning_types: null },
      ]);

      expect(rows[0].reasoning_types).toEqual([]);
    });

    it("未知の値を落とす", () => {
      const rows = buildInterviewOpinionRows(REPORT_ID, [
        {
          title: "意見",
          content: "内容",
          reasoning_types: ["professional_expertise", "evidence"],
        },
      ]);

      expect(rows[0].reasoning_types).toEqual(["professional_expertise"]);
    });
  });
});
