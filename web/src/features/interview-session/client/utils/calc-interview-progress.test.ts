import { describe, expect, it } from "vitest";
import { calcInterviewProgress } from "./calc-interview-progress";

describe("calcInterviewProgress", () => {
  describe("totalQuestionsが未定義または0の場合", () => {
    it("undefinedならnullを返す", () => {
      expect(calcInterviewProgress(undefined, "chat", [])).toBeNull();
    });

    it("0ならnullを返す", () => {
      expect(calcInterviewProgress(0, "chat", [])).toBeNull();
    });
  });

  describe("summary_completeステージ", () => {
    it("100%を返す", () => {
      const result = calcInterviewProgress(5, "summary_complete", []);
      expect(result).toEqual({
        percentage: 100,
        currentTopic: null,
        showSkip: false,
      });
    });

    it("メッセージにトピックがあればcurrentTopicを返す", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1", topicTitle: "経済" },
        { role: "user" as const },
      ];
      const result = calcInterviewProgress(5, "summary_complete", messages);
      expect(result).toEqual({
        percentage: 100,
        currentTopic: "経済",
        showSkip: false,
      });
    });
  });

  describe("summaryステージ", () => {
    it("90%固定を返す", () => {
      const result = calcInterviewProgress(5, "summary", []);
      expect(result).toEqual({
        percentage: 90,
        currentTopic: null,
        showSkip: false,
      });
    });

    it("メッセージにトピックがあればcurrentTopicを返す", () => {
      const messages = [
        {
          role: "assistant" as const,
          questionId: "q1",
          topicTitle: "社会保障",
        },
      ];
      const result = calcInterviewProgress(5, "summary", messages);
      expect(result).toEqual({
        percentage: 90,
        currentTopic: "社会保障",
        showSkip: false,
      });
    });
  });

  describe("chatステージ", () => {
    it("質問が未開始なら0%", () => {
      const result = calcInterviewProgress(5, "chat", []);
      expect(result).toEqual({
        percentage: 0,
        currentTopic: null,
        showSkip: true,
      });
    });

    it("1つ目の質問を聞いている最中は0%（現在の質問は完了扱いしない）", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1", topicTitle: "経済" },
      ];
      const result = calcInterviewProgress(5, "chat", messages);
      expect(result).toEqual({
        percentage: 0,
        currentTopic: "経済",
        showSkip: true,
      });
    });

    it("2問目に進んだら1問完了で16%（1/5 × 80）", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1", topicTitle: "経済" },
        { role: "user" as const },
        {
          role: "assistant" as const,
          questionId: "q2",
          topicTitle: "社会保障",
        },
      ];
      const result = calcInterviewProgress(5, "chat", messages);
      expect(result).toEqual({
        percentage: 16,
        currentTopic: "社会保障",
        showSkip: true,
      });
    });

    it("5問中4問完了で64%（4/5 × 80）", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1", topicTitle: "テーマ1" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q2", topicTitle: "テーマ2" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q3", topicTitle: "テーマ3" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q4", topicTitle: "テーマ4" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q5", topicTitle: "テーマ5" },
      ];
      const result = calcInterviewProgress(5, "chat", messages);
      expect(result).toEqual({
        percentage: 64,
        currentTopic: "テーマ5",
        showSkip: true,
      });
    });

    it("同じquestionIdの重複メッセージはカウントしない", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1", topicTitle: "経済" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q1" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q2", topicTitle: "教育" },
      ];
      // askedIds = {q1, q2}, size=2, completedCount=1
      const result = calcInterviewProgress(4, "chat", messages);
      expect(result).toEqual({
        percentage: 20, // 1/4 × 80 = 20
        currentTopic: "教育",
        showSkip: true,
      });
    });

    it("topicTitleがないメッセージばかりならcurrentTopicはnull", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q2" },
      ];
      const result = calcInterviewProgress(3, "chat", messages);
      expect(result?.currentTopic).toBeNull();
    });

    it("全問完了で80%", () => {
      const messages = [
        { role: "assistant" as const, questionId: "q1" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q2" },
        { role: "user" as const },
        { role: "assistant" as const, questionId: "q3" },
        { role: "user" as const },
      ];
      // askedIds = {q1, q2, q3}, size=3, completedCount=2
      // → 2/2 × 80 = 80 (totalQuestions=2 だと全完了)
      const result = calcInterviewProgress(2, "chat", messages);
      expect(result?.percentage).toBe(80);
    });
  });
});
