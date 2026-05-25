import { describe, expect, it } from "vitest";
import {
  BILL_STATUS_ORDER,
  type BillWithContent,
} from "@/features/bills/shared/types";
import {
  buildTargetedModeSystemPrompt,
  calculateTargetedModeNextQuestionId,
} from "./targeted-mode";
import type { InterviewPromptInput } from "./types";

const makeBill = (
  overrides: Partial<BillWithContent> = {}
): BillWithContent => ({
  id: "bill-1",
  name: "テスト法案",
  is_featured: false,
  is_review_completed: true,
  originating_house: "HR",
  shugiin_url: null,
  slug: null,
  diet_session_id: null,
  publish_status: "published",
  published_at: null,
  submitted_date: null,
  share_thumbnail_url: null,
  status: "introduced",
  status_note: null,
  status_order: BILL_STATUS_ORDER.introduced,
  publish_status_order: 2,
  thumbnail_url: null,
  knowledge_source: "厚生労働省の報告書",
  use_knowledge_source_in_chat: false,
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
  {
    id: "q1",
    question: "この法案についてどう思いますか？",
    follow_up_guide: "賛成・反対の理由を深掘りする",
  },
  {
    id: "q2",
    question: "業務への影響はありますか？",
    quick_replies: ["はい", "いいえ", "わからない"],
    follow_up_guide: "具体的な業務内容を聞く",
    target_audience: "業務で個人情報を扱う方",
  },
  {
    id: "q3",
    question: "専門家として技術的な観点で評価してください",
    target_audience: "当該法案分野の専門家",
  },
];

const baseParams: InterviewPromptInput = {
  bill: makeBill(),
  interviewConfig: {
    themes: ["医療", "教育"],
  },
  questions: sampleQuestions,
  currentStage: "chat",
  askedQuestionIds: new Set(),
};

describe("buildTargetedModeSystemPrompt", () => {
  it("法案情報がプロンプトに含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("テスト法案");
    expect(result).toContain("テスト法案タイトル");
    expect(result).toContain("テスト法案の要約です");
    expect(result).toContain("テスト法案の内容");
  });

  it("bill=nullの場合は空文字にフォールバックする", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      bill: null,
    });

    expect(result).toContain("- 法案名: \n");
    expect(result).toContain("- 法案タイトル: \n");
    expect(result).toContain("- 法案要約: \n");
  });

  it("テーマがプロンプトに含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("- 医療");
    expect(result).toContain("- 教育");
  });

  it("テーマ未設定の場合「（テーマ未設定）」が含まれる", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      interviewConfig: null,
    });

    expect(result).toContain("（テーマ未設定）");
  });

  it("知識ソースがプロンプトに含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("厚生労働省の報告書");
  });

  it("知識ソース未設定の場合「（知識ソース未設定）」が含まれる", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      bill: makeBill({ knowledge_source: null }),
    });

    expect(result).toContain("（知識ソース未設定）");
  });

  it("質問リストがID付きで含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("[ID: q1] この法案についてどう思いますか？");
    expect(result).toContain("[ID: q2] 業務への影響はありますか？");
    expect(result).toContain(
      "[ID: q3] 専門家として技術的な観点で評価してください"
    );
  });

  it("対象者条件が指定された質問は対象者ラベルを出力する", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("対象者: 業務で個人情報を扱う方");
    expect(result).toContain("対象者: 当該法案分野の専門家");
  });

  it("対象者条件がない質問は「全員（条件なし）」と表示する", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("対象者: 全員（条件なし）");
  });

  it("follow_up_guideが質問テキストに含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain(
      "フォローアップ指針: 賛成・反対の理由を深掘りする"
    );
    expect(result).toContain("フォローアップ指針: 具体的な業務内容を聞く");
  });

  it("follow_up_guideがない質問にはフォローアップ指針が付かない", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);
    const lines = result.split("\n");
    const q3HeaderIndex = lines.findIndex((l) => l.includes("[ID: q3]"));
    expect(q3HeaderIndex).toBeGreaterThan(-1);
    const q3Block = lines.slice(q3HeaderIndex, q3HeaderIndex + 3).join("\n");
    expect(q3Block).not.toContain("フォローアップ指針");
  });

  it("クイックリプライが質問テキストに含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("クイックリプライ: はい, いいえ, わからない");
  });

  it("対象者指定モード (Targeted Mode) と表示される", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("対象者指定モード");
    expect(result).toContain("Targeted Mode");
  });

  it("対象者条件に基づくスキップ判定セクションが含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("## 対象者条件に基づくスキップ判定");
    expect(result).toContain("完全に存在しないものとして扱い");
    expect(result).toContain("スキップを絶対に言及しない");
  });

  it("フォローアップ指針の優先ルールが含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("フォローアップ指針は最優先で守る");
  });

  it("質問が空の場合「（賛成か、反対か）」がフォールバックとして含まれる", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      questions: [],
    });

    expect(result).toContain("（賛成か、反対か）");
  });

  it("深掘りテクニックが含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("抽象⇔具体の往復");
    expect(result).toContain("仮定質問");
    expect(result).toContain("逆側の視点");
  });

  it("ステージ遷移ガイダンスが含まれる", () => {
    const result = buildTargetedModeSystemPrompt(baseParams);

    expect(result).toContain("ステージ遷移判定");
    expect(result).toContain("next_stage");
  });

  it("残り時間ガイダンスが含まれる（remainingMinutes指定時）", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      remainingMinutes: 15,
    });

    expect(result).toContain("残り目安時間");
    expect(result).toContain("15分");
  });

  it("残り時間ガイダンスが空（remainingMinutes=null時）", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      remainingMinutes: null,
    });

    expect(result).not.toContain("タイムマネジメント");
  });

  it("質問進捗がaskedQuestionIdsに基づいて反映される", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      askedQuestionIds: new Set(["q1", "q2"]),
    });

    expect(result).toContain("3問中2問完了（残り1問）");
  });

  it("summaryステージのガイダンスが生成される", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      currentStage: "summary",
    });

    expect(result).toContain("要約フェーズ");
  });

  it("summary_completeステージのガイダンスが生成される", () => {
    const result = buildTargetedModeSystemPrompt({
      ...baseParams,
      currentStage: "summary_complete",
    });

    expect(result).toContain("完了済み");
  });
});

describe("calculateTargetedModeNextQuestionId", () => {
  it("常にundefinedを返す（LLMに質問選択を任せる）", () => {
    const result = calculateTargetedModeNextQuestionId({
      messages: [],
      questions: sampleQuestions,
    });

    expect(result).toBeUndefined();
  });

  it("メッセージがあってもundefinedを返す", () => {
    const result = calculateTargetedModeNextQuestionId({
      messages: [
        { role: "assistant", content: "質問です" },
        { role: "user", content: "回答です" },
      ],
      questions: sampleQuestions,
    });

    expect(result).toBeUndefined();
  });

  it("質問リストが空でもundefinedを返す", () => {
    const result = calculateTargetedModeNextQuestionId({
      messages: [],
      questions: [],
    });

    expect(result).toBeUndefined();
  });
});
