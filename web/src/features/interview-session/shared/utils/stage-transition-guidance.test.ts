import { describe, expect, it } from "vitest";
import {
  buildBulkModeStageGuidance,
  buildLoopModeStageGuidance,
} from "./stage-transition-guidance";

const sampleQuestions = [
  { id: "q1", question: "この法案についてどう思いますか？" },
  { id: "q2", question: "業務への影響はありますか？" },
  { id: "q3", question: "改善案はありますか？" },
];

describe("buildBulkModeStageGuidance", () => {
  it("chatステージ: 質問が残っている場合の進捗表示", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1"]),
    });

    expect(result).toContain("3問中1問完了（残り2問）");
    expect(result).toContain("完了した質問");
    expect(result).toContain("[ID: q1]");
    expect(result).toContain("未回答の質問");
    expect(result).toContain("[ID: q2]");
    expect(result).toContain("[ID: q3]");
    expect(result).toContain("一括回答優先モード専用ルール");
  });

  it("chatステージ: 全質問完了時の進捗表示", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
    });

    expect(result).toContain("3問中3問完了（残り0問）");
    expect(result).toContain("完了した質問");
    expect(result).not.toContain("未回答の質問");
  });

  it("chatステージ: 質問なしの場合", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "chat",
      questions: [],
      askedQuestionIds: new Set(),
    });

    expect(result).toContain("0問中0問完了（残り0問）");
    expect(result).not.toContain("完了した質問");
    expect(result).not.toContain("未回答の質問");
  });

  it("chatステージ: askedQuestionIdsにquestions外のIDが含まれても負にならない", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3", "q_unknown"]),
    });

    // 3問中3問完了（残り0問） - q_unknownは無視される
    expect(result).toContain("3問中3問完了（残り0問）");
  });

  it("summaryステージ: summary固有のガイダンスが含まれる", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "summary",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
    });

    expect(result).toContain("summary_complete");
    expect(result).toContain("要約フェーズ");
    expect(result).not.toContain("一括回答優先モード専用ルール");
  });

  it("summary_completeステージ: 完了ガイダンスが含まれる", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "summary_complete",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
    });

    expect(result).toContain("完了済み");
  });

  it("askedQuestionIdsが空の場合は全て未回答", () => {
    const result = buildBulkModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(),
    });

    expect(result).toContain("3問中0問完了（残り3問）");
    expect(result).not.toContain("完了した質問");
    expect(result).toContain("未回答の質問");
  });
});

describe("buildLoopModeStageGuidance", () => {
  it("chatステージ: 都度深掘りモード固有のガイダンスが含まれる", () => {
    const result = buildLoopModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1"]),
    });

    expect(result).toContain("都度深掘りモード");
    expect(result).toContain("事前定義質問の消化を急がないでください");
    expect(result).toContain("3問中1問完了（残り2問）");
  });

  it("chatステージ: 全質問完了時", () => {
    const result = buildLoopModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
    });

    expect(result).toContain("3問中3問完了（残り0問）");
  });

  it("chatステージ: 質問なしの場合", () => {
    const result = buildLoopModeStageGuidance({
      currentStage: "chat",
      questions: [],
      askedQuestionIds: new Set(),
    });

    expect(result).toContain("0問中0問完了（残り0問）");
  });

  it("chatステージ: askedQuestionIdsにquestions外のIDが含まれても負にならない", () => {
    const result = buildLoopModeStageGuidance({
      currentStage: "chat",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3", "q_unknown"]),
    });

    expect(result).toContain("3問中3問完了（残り0問）");
  });

  it("summaryステージ: summary固有のガイダンスが含まれる", () => {
    const result = buildLoopModeStageGuidance({
      currentStage: "summary",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
    });

    expect(result).toContain("summary_complete");
    expect(result).toContain("要約フェーズ");
    expect(result).not.toContain("都度深掘りモード");
  });

  it("summary_completeステージ: 完了ガイダンスが含まれる", () => {
    const result = buildLoopModeStageGuidance({
      currentStage: "summary_complete",
      questions: sampleQuestions,
      askedQuestionIds: new Set(["q1", "q2", "q3"]),
    });

    expect(result).toContain("完了済み");
  });
});
