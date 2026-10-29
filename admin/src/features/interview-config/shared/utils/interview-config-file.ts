import { parsePromptOverridesByMode } from "@mirai-gikai/shared/interview-prompts/sections";
import type { z } from "zod";
import {
  type InterviewConfig,
  type InterviewQuestion,
  interviewConfigSchema,
  interviewQuestionsInputSchema,
} from "../types";

/**
 * インタビュー設定のファイル書き出し・読み込み。
 * 保存済みの設定を JSON に書き出し、そのファイルから別の法案・別の環境に設定を作る
 * （ステージングで作った設定を本番へ移す、といった使い方を想定）。
 *
 * ファイルに入れるのはインタビューの中身（設定と質問）だけ。公開状態や法案のように
 * その環境・その回の運用に結びつくものは入れず、読み込んだ側で決め直す。
 */

/** ファイルの種類を見分ける印。別の JSON を読み込んだときに分かるようにする */
export const INTERVIEW_CONFIG_FILE_FORMAT = "mirai-gikai/interview-config";

/** ファイル形式の版。中身の形を変えたら上げて、読み込み側で古い版を変換する */
export const INTERVIEW_CONFIG_FILE_VERSION = 1;

/** ファイルに入れる設定の中身。読み込み時の検証スキーマ（fileContentSchema）から導く */
export type InterviewConfigFileContent = z.output<typeof fileContentSchema>;

export type InterviewConfigFile = {
  format: typeof INTERVIEW_CONFIG_FILE_FORMAT;
  version: typeof INTERVIEW_CONFIG_FILE_VERSION;
  /** 書き出した日時（ISO 8601）。読み込みには使わない */
  exportedAt: string;
  config: InterviewConfigFileContent;
};

type ParseResult =
  | { success: true; value: InterviewConfigFileContent }
  | { success: false; error: string };

/** 保存済みの設定と質問を書き出す形にする */
export function toInterviewConfigFile(
  config: InterviewConfig,
  questions: InterviewQuestion[],
  exportedAt: Date
): InterviewConfigFile {
  return {
    format: INTERVIEW_CONFIG_FILE_FORMAT,
    version: INTERVIEW_CONFIG_FILE_VERSION,
    exportedAt: exportedAt.toISOString(),
    config: {
      name: config.name,
      mode: config.mode,
      themes: config.themes ?? [],
      chat_model: config.chat_model,
      estimated_duration: config.estimated_duration,
      prompt_overrides: parsePromptOverridesByMode(config.prompt_overrides),
      // 質問の id・並び順は持ち出さない（配列の順を並び順とし、保存時に採番し直す）
      questions: [...questions]
        .sort((a, b) => a.question_order - b.question_order)
        .map((q) => ({
          question: q.question,
          follow_up_guide: q.follow_up_guide ?? undefined,
          quick_replies: q.quick_replies ?? undefined,
          target_audience: q.target_audience ?? undefined,
        })),
    },
  };
}

/** 書き出すファイルの名前。ファイル名に使えない文字は置き換える */
export function interviewConfigFileName(name: string): string {
  const safeName = name
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `interview-config-${safeName || "untitled"}.json`;
}

/** 書き出すファイルの本文。人が開いて読めるよう字下げする */
export function serializeInterviewConfigFile(
  file: InterviewConfigFile
): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** 古いファイルや手で書いたファイルで省略された項目は空として受け付ける */
const fileContentSchema = interviewConfigSchema
  .omit({ status: true, themes: true, prompt_overrides: true })
  .extend({
    themes: interviewConfigSchema.shape.themes.default([]),
    // 保存時（createInterviewConfig）と同じく空文字も既定モデル扱いにする
    chat_model: interviewConfigSchema.shape.chat_model.transform(
      (value) => value || null
    ),
    estimated_duration:
      interviewConfigSchema.shape.estimated_duration.transform(
        (value) => value ?? null
      ),
    prompt_overrides: interviewConfigSchema.shape.prompt_overrides.default({}),
    questions: interviewQuestionsInputSchema.default([]),
  });

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.map(String).join(".");
  return path ? `「${path}」: ${issue.message}` : issue.message;
}

/**
 * 読み込んだファイルの本文を、設定を作るための値にする。
 * 文字数やモデル名などは保存時と同じ基準で検証する。
 */
export function parseInterviewConfigFile(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { success: false, error: "JSON として読めませんでした。" };
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("format" in parsed) ||
    parsed.format !== INTERVIEW_CONFIG_FILE_FORMAT
  ) {
    return {
      success: false,
      error:
        "インタビュー設定のファイルではありません。設定一覧で書き出したファイルを選んでください。",
    };
  }
  if (
    !("version" in parsed) ||
    parsed.version !== INTERVIEW_CONFIG_FILE_VERSION
  ) {
    const version = "version" in parsed ? String(parsed.version) : "なし";
    return {
      success: false,
      error: `対応していない版のファイルです（版: ${version}）。`,
    };
  }
  if (!("config" in parsed)) {
    return { success: false, error: "設定の中身（config）がありません。" };
  }

  const result = fileContentSchema.safeParse(parsed.config);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map(formatIssue).join("\n"),
    };
  }
  return { success: true, value: result.data };
}
