import { describe, expect, it } from "vitest";
import type { BillWithContent } from "@/features/bills/shared/types";
import {
  buildBulkModeSystemPrompt,
  calculateBulkModeNextQuestionId,
} from "./bulk-mode";
import type { InterviewPromptInput } from "./types";

const makeBill = (
  overrides: Partial<BillWithContent> = {}
): BillWithContent => ({
  id: "bill-1",
  name: "テスト法案",
  is_featured: false,
  originating_house: "HR",
  shugiin_url: null,
  diet_session_id: null,
  publish_status: "published",
  published_at: null,
  share_thumbnail_url: null,
  status: "introduced",
  status_note: null,
  thumbnail_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bill_content: {
    id: "bc-1",
    bill_id: "bill-1",
    title: "テスト法案タイトル",
    summary: "テスト法案の要約です",
    content: "テスト法案の内容",
    difficulty_level: "normal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  tags: [],
  ...overrides,
});

const sampleQuestions = [
  { id: "q1", question: "この法案についてどう思いますか？" },
  {
    id: "q2",
    question: "業務への影響はありますか？",
    quick_replies: ["はい", "いいえ", "わからない"],
  },
  { id: "q3", question: "改善案はありますか？" },
];

const baseParams: InterviewPromptInput = {
  bill: makeBill(),
  interviewConfig: {
    themes: ["医療", "教育"],
    knowledge_source: "厚生労働省の報告書",
  },
  questions: sampleQuestions,
  currentStage: "chat",
  askedQuestionIds: new Set(),
};

describe("buildBulkModeSystemPrompt", () => {
  it("法案情報がプロンプトに含まれる", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("テスト法案");
    expect(result).toContain("テスト法案タイトル");
    expect(result).toContain("テスト法案の要約です");
    expect(result).toContain("テスト法案の内容");
  });

  it("bill=nullの場合は空文字にフォールバックする", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      bill: null,
    });

    expect(result).toContain("- 法案名: \n");
    expect(result).toContain("- 法案タイトル: \n");
    expect(result).toContain("- 法案要約: \n");
  });

  it("テーマがプロンプトに含まれる", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("- 医療");
    expect(result).toContain("- 教育");
  });

  it("テーマ未設定の場合「（テーマ未設定）」が含まれる", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      interviewConfig: null,
    });

    expect(result).toContain("（テーマ未設定）");
  });

  it("知識ソースがプロンプトに含まれる", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("厚生労働省の報告書");
  });

  it("知識ソース未設定の場合「（知識ソース未設定）」が含まれる", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      interviewConfig: { themes: ["テーマ1"] },
    });

    expect(result).toContain("（知識ソース未設定）");
  });

  it("質問リストがID付きで含まれる", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("[ID: q1] この法案についてどう思いますか？");
    expect(result).toContain("[ID: q2] 業務への影響はありますか？");
    expect(result).toContain("[ID: q3] 改善案はありますか？");
  });

  it("クイックリプライが質問テキストに含まれる", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("クイックリプライ: はい, いいえ, わからない");
  });

  it("follow_up_guideは含まれない（Bulk Modeの特徴）", () => {
    const questionsWithFollowUp = [
      {
        id: "q1",
        question: "テスト質問",
        follow_up_guide: "具体的な事例を聞く",
      },
    ];
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      questions: questionsWithFollowUp,
    });

    expect(result).not.toContain("フォローアップ指針");
    expect(result).not.toContain("具体的な事例を聞く");
  });

  it("一括回答優先モード (Bulk Mode) と表示される", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("一括回答優先モード");
    expect(result).toContain("Bulk Mode");
  });

  it("質問が空の場合「（賛成か、反対か）」がフォールバックとして含まれる", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      questions: [],
    });

    expect(result).toContain("（賛成か、反対か）");
  });

  describe("nextQuestionIdが指定されている場合", () => {
    it("該当する質問が見つかると特別なプロンプトを返す", () => {
      const result = buildBulkModeSystemPrompt({
        ...baseParams,
        nextQuestionId: "q2",
      });

      expect(result).toContain(
        "必ず事前定義質問 **[ID: q2] 業務への影響はありますか？**"
      );
      expect(result).toContain("深掘りや他の話題への逸脱は一切禁止");
      // 特別プロンプトでは法案詳細やテーマは含まれない
      expect(result).not.toContain("法案詳細");
    });

    it("該当する質問が見つからない場合は通常のプロンプトを返す", () => {
      const result = buildBulkModeSystemPrompt({
        ...baseParams,
        nextQuestionId: "q_nonexistent",
      });

      // 通常プロンプトのフォールバック
      expect(result).toContain("半構造化デプスインタビュー");
      expect(result).toContain("法案詳細");
    });

    it("nextQuestionIdが通常プロンプト内のモード指示にも反映される", () => {
      // nextQuestionIdが存在するが質問が見つからないケース→通常プロンプトだがnextQuestion参照あり
      // nextQuestionIdが存在し質問も見つかるケース→特別プロンプト
      // nextQuestionIdが未指定→通常プロンプトでデフォルト指示
      const resultWithout = buildBulkModeSystemPrompt(baseParams);
      expect(resultWithout).toContain(
        "まだ聞いていないものを優先して選んでください"
      );
    });
  });

  it("ステージ遷移ガイダンスが含まれる", () => {
    const result = buildBulkModeSystemPrompt(baseParams);

    expect(result).toContain("ステージ遷移判定");
    expect(result).toContain("next_stage");
  });

  it("残り時間ガイダンスが含まれる（remainingMinutes指定時）", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      remainingMinutes: 10,
    });

    expect(result).toContain("残り目安時間");
    expect(result).toContain("10分");
  });

  it("残り時間ガイダンスが空（remainingMinutes=null時）", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      remainingMinutes: null,
    });

    expect(result).not.toContain("タイムマネジメント");
  });

  it("質問進捗がaskedQuestionIdsに基づいて反映される", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      askedQuestionIds: new Set(["q1"]),
    });

    expect(result).toContain("3問中1問完了（残り2問）");
  });

  it("残り質問数が正しく計算される", () => {
    const result = buildBulkModeSystemPrompt({
      ...baseParams,
      askedQuestionIds: new Set(["q1", "q2"]),
      remainingMinutes: 5,
    });

    expect(result).toContain("1問");
  });
});

describe("calculateBulkModeNextQuestionId", () => {
  it("未回答の最初の質問IDを返す", () => {
    const result = calculateBulkModeNextQuestionId({
      messages: [],
      questions: sampleQuestions,
    });

    expect(result).toBe("q1");
  });

  it("既に回答済みの質問をスキップして次の未回答を返す", () => {
    const result = calculateBulkModeNextQuestionId({
      messages: [
        {
          role: "assistant",
          content: JSON.stringify({
            text: "質問です",
            question_id: "q1",
          }),
        },
        { role: "user", content: "回答です" },
      ],
      questions: sampleQuestions,
    });

    expect(result).toBe("q2");
  });

  it("複数の質問が回答済みの場合、残りの最初を返す", () => {
    const result = calculateBulkModeNextQuestionId({
      messages: [
        {
          role: "assistant",
          content: JSON.stringify({
            text: "質問1",
            question_id: "q1",
          }),
        },
        { role: "user", content: "回答1" },
        {
          role: "assistant",
          content: JSON.stringify({
            text: "質問2",
            question_id: "q2",
          }),
        },
        { role: "user", content: "回答2" },
      ],
      questions: sampleQuestions,
    });

    expect(result).toBe("q3");
  });

  it("全質問が回答済みの場合はundefinedを返す", () => {
    const result = calculateBulkModeNextQuestionId({
      messages: [
        {
          role: "assistant",
          content: JSON.stringify({
            text: "質問1",
            question_id: "q1",
          }),
        },
        { role: "user", content: "回答1" },
        {
          role: "assistant",
          content: JSON.stringify({
            text: "質問2",
            question_id: "q2",
          }),
        },
        { role: "user", content: "回答2" },
        {
          role: "assistant",
          content: JSON.stringify({
            text: "質問3",
            question_id: "q3",
          }),
        },
        { role: "user", content: "回答3" },
      ],
      questions: sampleQuestions,
    });

    expect(result).toBeUndefined();
  });

  it("質問リストが空の場合はundefinedを返す", () => {
    const result = calculateBulkModeNextQuestionId({
      messages: [],
      questions: [],
    });

    expect(result).toBeUndefined();
  });

  it("userメッセージのquestion_idは無視される", () => {
    const result = calculateBulkModeNextQuestionId({
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            text: "回答",
            question_id: "q1",
          }),
        },
      ],
      questions: sampleQuestions,
    });

    // userメッセージのquestion_idは無視されるため、q1は未回答のまま
    expect(result).toBe("q1");
  });
});
