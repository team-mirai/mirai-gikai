import { describe, expect, it } from "vitest";
import type { InterviewConfig, InterviewQuestion } from "../types";
import {
  INTERVIEW_CONFIG_FILE_FORMAT,
  INTERVIEW_CONFIG_FILE_VERSION,
  interviewConfigFileName,
  parseInterviewConfigFile,
  serializeInterviewConfigFile,
  toInterviewConfigFile,
} from "./interview-config-file";

const config: InterviewConfig = {
  id: "config-001",
  bill_id: "bill-001",
  name: "デフォルト設定",
  status: "public",
  mode: "targeted",
  themes: ["テーマA", "テーマB"],
  chat_model: "openai/gpt-5-mini",
  estimated_duration: 15,
  prompt_overrides: { loop: { cautions: "丁寧に聞く" } },
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  deleted_at: null,
};

const questions: InterviewQuestion[] = [
  {
    id: "q-002",
    interview_config_id: "config-001",
    question: "質問2",
    follow_up_guide: null,
    quick_replies: null,
    target_audience: null,
    question_order: 2,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "q-001",
    interview_config_id: "config-001",
    question: "質問1",
    follow_up_guide: "深掘りする",
    quick_replies: ["はい", "いいえ"],
    target_audience: "専門家",
    question_order: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

const exportedAt = new Date("2026-10-23T00:00:00Z");

function fileText(configBody: unknown, overrides: object = {}): string {
  return JSON.stringify({
    format: INTERVIEW_CONFIG_FILE_FORMAT,
    version: INTERVIEW_CONFIG_FILE_VERSION,
    exportedAt: exportedAt.toISOString(),
    config: configBody,
    ...overrides,
  });
}

describe("toInterviewConfigFile", () => {
  it("設定の中身と質問を書き出し、環境に結びつく値は含めない", () => {
    const file = toInterviewConfigFile(config, questions, exportedAt);

    expect(file.format).toBe(INTERVIEW_CONFIG_FILE_FORMAT);
    expect(file.version).toBe(INTERVIEW_CONFIG_FILE_VERSION);
    expect(file.exportedAt).toBe("2026-10-23T00:00:00.000Z");
    expect(file.config).toEqual({
      name: "デフォルト設定",
      mode: "targeted",
      themes: ["テーマA", "テーマB"],
      chat_model: "openai/gpt-5-mini",
      estimated_duration: 15,
      prompt_overrides: { loop: { cautions: "丁寧に聞く" } },
      questions: [
        {
          question: "質問1",
          follow_up_guide: "深掘りする",
          quick_replies: ["はい", "いいえ"],
          target_audience: "専門家",
        },
        {
          question: "質問2",
          follow_up_guide: undefined,
          quick_replies: undefined,
          target_audience: undefined,
        },
      ],
    });
    expect(file.config).not.toHaveProperty("status");
    expect(file.config).not.toHaveProperty("bill_id");
  });

  it("themes が null なら空配列にする", () => {
    const file = toInterviewConfigFile(
      { ...config, themes: null },
      [],
      exportedAt
    );
    expect(file.config.themes).toEqual([]);
  });
});

describe("interviewConfigFileName", () => {
  it("設定名からファイル名を作る", () => {
    expect(interviewConfigFileName("デフォルト設定")).toBe(
      "interview-config-デフォルト設定.json"
    );
  });

  it("ファイル名に使えない文字と空白を置き換える", () => {
    expect(interviewConfigFileName(" A/B テスト: 1 ")).toBe(
      "interview-config-A-B-テスト-1.json"
    );
  });

  it("空の設定名は untitled にする", () => {
    expect(interviewConfigFileName("  ")).toBe(
      "interview-config-untitled.json"
    );
  });
});

describe("parseInterviewConfigFile", () => {
  it("書き出したファイルを読み戻せる", () => {
    const file = toInterviewConfigFile(config, questions, exportedAt);
    const result = parseInterviewConfigFile(serializeInterviewConfigFile(file));

    expect(result).toEqual({
      success: true,
      value: {
        ...file.config,
        questions: [
          {
            question: "質問1",
            follow_up_guide: "深掘りする",
            quick_replies: ["はい", "いいえ"],
            target_audience: "専門家",
          },
          { question: "質問2" },
        ],
      },
    });
  });

  it("省略された項目は空として受け付ける", () => {
    const result = parseInterviewConfigFile(
      fileText({ name: "最小構成", mode: "loop" })
    );

    expect(result).toEqual({
      success: true,
      value: {
        name: "最小構成",
        mode: "loop",
        themes: [],
        chat_model: null,
        estimated_duration: null,
        prompt_overrides: {},
        questions: [],
      },
    });
  });

  it("JSON でなければエラー", () => {
    expect(parseInterviewConfigFile("{")).toEqual({
      success: false,
      error: "JSON として読めませんでした。",
    });
  });

  it("format が違えばエラー", () => {
    const result = parseInterviewConfigFile(
      fileText({ name: "x", mode: "loop" }, { format: "other" })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(
        "インタビュー設定のファイルではありません"
      );
    }
  });

  it("version が違えばエラー", () => {
    const result = parseInterviewConfigFile(
      fileText({ name: "x", mode: "loop" }, { version: 2 })
    );
    expect(result).toEqual({
      success: false,
      error: "対応していない版のファイルです（版: 2）。",
    });
  });

  it("config が無ければエラー", () => {
    const result = parseInterviewConfigFile(
      JSON.stringify({
        format: INTERVIEW_CONFIG_FILE_FORMAT,
        version: INTERVIEW_CONFIG_FILE_VERSION,
      })
    );
    expect(result).toEqual({
      success: false,
      error: "設定の中身（config）がありません。",
    });
  });

  it("保存時と同じ基準で中身を検証し、問題の項目を示す", () => {
    const result = parseInterviewConfigFile(
      fileText({
        name: "x",
        mode: "unknown",
        questions: [{ question: "" }],
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("「mode」");
      expect(result.error).toContain(
        "「questions.0.question」: 質問文は必須です"
      );
    }
  });

  it("使えない AI モデルはエラー", () => {
    const result = parseInterviewConfigFile(
      fileText({ name: "x", mode: "loop", chat_model: "unknown/model" })
    );
    expect(result).toEqual({
      success: false,
      error: "「chat_model」: 無効なAIモデルが指定されています",
    });
  });
});
