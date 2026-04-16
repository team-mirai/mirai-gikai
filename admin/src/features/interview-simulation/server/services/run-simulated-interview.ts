import "server-only";

import { buildSummarySystemPrompt } from "@mirai-gikai/shared/interview-prompts/summary";
import type {
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
import { generateObject, generateText, type ModelMessage } from "ai";
import { z } from "zod";
import type { AiModel } from "@/lib/ai/models";
import { type PromptKind, SIMULATION_MAX_TURNS } from "../../shared/constants";
import {
  type PersonaCharacterSheet,
  type SimGeneratedReport,
  type SimulatedTurn,
  simGeneratedReportSchema,
} from "../../shared/schemas";
import type { SimulationMetrics, SimulationRun } from "../../shared/types";
import { buildIntervieweeSystemPrompt } from "../../shared/utils/build-interviewee-system-prompt";
import type { OriginalStyleAnchors } from "../../shared/utils/extract-original-style-anchors";
import { isShortAnswer } from "../../shared/utils/format-transcript";
import { refreshStageGuidance } from "../../shared/utils/refresh-stage-guidance";

/**
 * シミュレーション中のインタビュアー LLM が返す最低限のフィールド
 * （本番の interviewChatTextSchema に近いが、シミュ用に簡略化）
 */
const simInterviewerOutputSchema = z
  .object({
    text: z.string().describe("インタビュアーの発話本文"),
    topic_title: z
      .string()
      .nullable()
      .describe("質問のテーマ短縮タイトル。なければ null"),
    question_id: z
      .string()
      .nullable()
      .describe("事前定義質問の ID。深掘り等で該当なしなら null"),
    next_stage: z
      .enum(["chat", "summary", "summary_complete"])
      .describe("次のステージ。インタビュー継続中は chat"),
    quick_replies: z
      .array(z.string())
      .nullable()
      .describe(
        "ユーザーに提示する選択肢。事前定義質問の quick_replies または、Yes/No 的な選択を促したい場合に設定。不要なら null"
      ),
  })
  .strict();

interface RunSimulatedInterviewParams {
  persona: PersonaCharacterSheet;
  interviewerSystemPrompt: string;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  traceId: string;
  kind: PromptKind;
  questionsCount: number;
  /** 元インタビューから抽出した文体指標（省略可）。渡すとインタビュイー LLM の回答長を元会話レンジに寄せる */
  styleAnchors?: OriginalStyleAnchors;
  maxTurns?: number;
  /** Summary フェーズ用。本番と同じ buildSummarySystemPrompt で構築する素材 */
  summaryInputs?: {
    bill: PromptBillInput;
    interviewConfig: PromptInterviewConfig;
  };
  /** Summary フェーズ用モデル。省略時は interviewerModel と同じ */
  summaryModel?: AiModel;
  /**
   * 初回ターン用の enhanced prompt 構築情報。
   * 本番の `generateInitialQuestion` と同等の挙動を再現するため、初回だけ
   * system prompt 末尾に「## 重要: これはインタビューの開始です…」を付与し、
   * messages なし・prompt 直渡しで LLM を呼ぶ。
   */
  initialTurnEnhancement?: {
    billTitle: string;
    firstQuestionId: string | null;
  };
  /**
   * 毎ターンの「事前定義質問の進捗状況」セクション更新に使う。
   * これを渡すと、本番 handleInterviewChatRequest と同じく毎ターン
   * askedQuestionIds を反映した進捗が system prompt に注入される。
   */
  dynamicStageGuidance?: {
    questions: PromptInterviewQuestion[];
    mode: "loop" | "bulk";
  };
}

function asInterviewerMessages(turns: SimulatedTurn[]): ModelMessage[] {
  return turns.map<ModelMessage>((t) => {
    if (t.role === "interviewer") {
      // インタビュアー視点では自分の過去発話は assistant、
      // 元プロンプトが JSON 出力を要求しているので JSON 文字列で再現する
      const payload = {
        text: t.content,
        topic_title: t.topic_title ?? null,
        question_id: t.question_id ?? null,
        next_stage: t.next_stage ?? "chat",
        quick_replies: t.quick_replies ?? null,
      };
      return { role: "assistant", content: JSON.stringify(payload) };
    }
    return { role: "user", content: t.content };
  });
}

function asIntervieweeMessages(turns: SimulatedTurn[]): ModelMessage[] {
  return turns.map<ModelMessage>((t) => {
    if (t.role === "interviewee") {
      return { role: "assistant", content: t.content };
    }
    // インタビュアー発話はそのまま user メッセージとして渡す。
    // quick_replies 情報は user メッセージには混ぜず、
    // インタビュイー LLM の system prompt 側で別途提示する
    //（本番ではユーザーが選択肢をタップするだけで suffix は付かないため）。
    return { role: "user", content: t.content };
  });
}

function computeMetrics(
  transcript: SimulatedTurn[],
  uniqueQuestionIds: Set<string>,
  questionsCount: number
): SimulationMetrics {
  const interviewerTurns = transcript.filter((t) => t.role === "interviewer");
  const intervieweeTurns = transcript.filter((t) => t.role === "interviewee");
  const shortAnswerCount = intervieweeTurns.filter((t) =>
    isShortAnswer(t.content)
  ).length;
  const sumChars = (turns: SimulatedTurn[]) =>
    turns.reduce((acc, t) => acc + t.content.length, 0);
  const avg = (sum: number, n: number) => (n === 0 ? 0 : Math.round(sum / n));

  return {
    totalTurns: transcript.length,
    interviewerTurns: interviewerTurns.length,
    intervieweeTurns: intervieweeTurns.length,
    shortAnswerCount,
    askedQuestionIds: [...uniqueQuestionIds],
    questionCoverage:
      questionsCount > 0 ? uniqueQuestionIds.size / questionsCount : 0,
    avgInterviewerChars: avg(
      sumChars(interviewerTurns),
      interviewerTurns.length
    ),
    avgIntervieweeChars: avg(
      sumChars(intervieweeTurns),
      intervieweeTurns.length
    ),
  };
}

/**
 * 元インタビュアーのターン数から、シミュのターン上限を算出する。
 * 元が短ければシミュも短く、元が長ければ元並みに（ただし hard cap を超えない）。
 * この値は LLM には伝えない（本番プロンプトをいじらないため）。純粋に実行側の安全装置。
 */
function deriveTargetMaxTurns(
  hardCap: number,
  originalInterviewerTurns: number | undefined,
  questionsCount: number
): number {
  const hasOriginal = (originalInterviewerTurns ?? 0) > 0;
  if (!hasOriginal) return hardCap;
  const target = Math.max(
    (originalInterviewerTurns ?? 0) + 1,
    Math.min(questionsCount + 1, hardCap)
  );
  return Math.min(target, hardCap);
}

export async function runSimulatedInterview({
  persona,
  interviewerSystemPrompt,
  interviewerModel,
  intervieweeModel,
  traceId,
  kind,
  questionsCount,
  styleAnchors,
  maxTurns = SIMULATION_MAX_TURNS,
  summaryInputs,
  summaryModel,
  initialTurnEnhancement,
  dynamicStageGuidance,
}: RunSimulatedInterviewParams): Promise<SimulationRun> {
  const effectiveMaxTurns = deriveTargetMaxTurns(
    maxTurns,
    styleAnchors?.originalInterviewerTurns,
    questionsCount
  );
  const transcript: SimulatedTurn[] = [];
  const askedQuestionIds = new Set<string>();
  const startedAt = Date.now();
  // インタビュイーが元の発言回数を超えないうちに自然に畳ませるための「予算」
  const intervieweeBudget = styleAnchors?.originalIntervieweeTurns;

  let stopReason: SimulationRun["stopReason"] = "max_turns";

  // インタビュアーがリードするので、ターンはペア単位 (interviewer + interviewee) で進む
  for (let turnIndex = 0; turnIndex < effectiveMaxTurns; turnIndex++) {
    // --- インタビュアーの発話 ---
    // 本番の handleInterviewChatRequest は毎ターン system prompt を再構築して
    // 「完了した質問 / 未回答の質問」セクションを更新する。
    // シミュでも同じ挙動にするため、現在の askedQuestionIds で進捗セクションを
    // 差し替えてから LLM に渡す。
    const interviewerSystemPromptForThisTurn = dynamicStageGuidance
      ? refreshStageGuidance({
          userSystemPrompt: interviewerSystemPrompt,
          askedQuestionIds,
          questions: dynamicStageGuidance.questions,
          mode: dynamicStageGuidance.mode,
        })
      : interviewerSystemPrompt;

    let interviewerOutput: z.infer<typeof simInterviewerOutputSchema>;
    try {
      // 初回ターンは本番 generateInitialQuestion と同じ挙動にする。
      // 「## 重要: これはインタビューの開始です…」を system prompt 末尾に付与し、
      // messages は渡さず prompt 直渡しで呼び出す。
      const isInitialTurn = turnIndex === 0 && transcript.length === 0;
      if (isInitialTurn && initialTurnEnhancement) {
        const { billTitle, firstQuestionId } = initialTurnEnhancement;
        const enhancedPrompt = `${interviewerSystemPromptForThisTurn}\n\n## 重要: これはインタビューの開始です。ユーザーからのメッセージはありません。事前定義質問の最初の質問から始めてください。挨拶は温かく丁寧に（2文程度）、「${billTitle}」についてのインタビューであることを明確に伝えた上で、すぐに最初の質問をしてください。最初の質問にクイックリプライが設定されている場合は、必ず quick_replies フィールドに含めてください。${firstQuestionId ? `最初の質問は ID: ${firstQuestionId} であり、レスポンスの question_id にこの値を含めてください。` : ""}`;
        const { object } = await generateObject({
          model: interviewerModel,
          schema: simInterviewerOutputSchema,
          prompt: enhancedPrompt,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "sim-interviewer-initial",
            metadata: { traceId, kind, turnIndex: String(turnIndex) },
          },
        });
        interviewerOutput = object;
      } else {
        const messages = asInterviewerMessages(transcript);
        const { object } = await generateObject({
          model: interviewerModel,
          schema: simInterviewerOutputSchema,
          system: interviewerSystemPromptForThisTurn,
          messages,
          experimental_telemetry: {
            isEnabled: true,
            functionId: "sim-interviewer",
            metadata: {
              traceId,
              kind,
              turnIndex: String(turnIndex),
            },
          },
        });
        interviewerOutput = object;
      }
    } catch (error) {
      console.error("[Simulation] interviewer LLM failed:", error);
      stopReason = "interviewer_error";
      break;
    }

    const interviewerQuickReplies =
      interviewerOutput.quick_replies &&
      interviewerOutput.quick_replies.length > 0
        ? interviewerOutput.quick_replies
        : null;
    transcript.push({
      role: "interviewer",
      content: interviewerOutput.text,
      topic_title: interviewerOutput.topic_title ?? null,
      question_id: interviewerOutput.question_id ?? null,
      next_stage: interviewerOutput.next_stage ?? "chat",
      quick_replies: interviewerQuickReplies,
    });

    if (interviewerOutput.question_id) {
      askedQuestionIds.add(interviewerOutput.question_id);
    }

    if (
      interviewerOutput.next_stage === "summary" ||
      interviewerOutput.next_stage === "summary_complete"
    ) {
      stopReason = interviewerOutput.next_stage;
      break;
    }

    // 最終イテレーションでは、インタビュイーの返答を生成せずに終了する。
    // → transcript は必ずインタビュアー発話で終わる。
    // これにより、max_turns 到達時でも「インタビュイーで終わる」挙動を構造的に排除できる。
    // 本番プロンプトには手を加えず、シミュレータ側の安全装置として実装。
    if (turnIndex === effectiveMaxTurns - 1) {
      break;
    }

    // --- インタビュイーの返答 ---
    // この発言が「何回目のインタビュイー発言」になるかをカウントしてプロンプトに反映。
    // 元の発言回数に近づいたら、インタビュイー LLM が自然に畳みにかかるように促す。
    // 直前のインタビュアー発話の quick_replies は system prompt 側で別途提示し、
    // user メッセージには混ぜない（本番と同じユーザー入力形式を保つため）。
    const intervieweeTurnNumber =
      transcript.filter((t) => t.role === "interviewee").length + 1;
    const intervieweeSystemPrompt = buildIntervieweeSystemPrompt(
      persona,
      styleAnchors,
      { intervieweeTurnNumber, expectedBudget: intervieweeBudget },
      interviewerQuickReplies
    );
    try {
      const messages = asIntervieweeMessages(transcript);
      const { text } = await generateText({
        model: intervieweeModel,
        system: intervieweeSystemPrompt,
        messages,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "sim-interviewee",
          metadata: {
            traceId,
            kind,
            turnIndex: String(turnIndex),
            intervieweeTurnNumber: String(intervieweeTurnNumber),
          },
        },
      });
      transcript.push({
        role: "interviewee",
        content: text.trim(),
      });
    } catch (error) {
      console.error("[Simulation] interviewee LLM failed:", error);
      stopReason = "interviewee_error";
      break;
    }
  }

  // Summary フェーズ: 本番プロンプト側で summary / summary_complete に遷移した場合のみ、
  // 本番と同じ buildSummarySystemPrompt で Summary LLM を呼び、構造化レポートを生成する。
  // （max_turns 到達や、遷移しなかった場合は null のまま）
  let generatedReport: SimGeneratedReport | null = null;
  if (
    (stopReason === "summary" || stopReason === "summary_complete") &&
    summaryInputs
  ) {
    try {
      const summaryMessages = transcript.map((t) => ({
        role: t.role === "interviewer" ? "assistant" : "user",
        content: t.content,
      }));
      const summarySystemPrompt = buildSummarySystemPrompt({
        bill: summaryInputs.bill,
        interviewConfig: summaryInputs.interviewConfig,
        messages: summaryMessages,
      });
      const { object } = await generateObject({
        model: summaryModel ?? interviewerModel,
        schema: simGeneratedReportSchema,
        system: summarySystemPrompt,
        prompt:
          "上記の会話履歴をもとに、スキーマに従ってレポートを JSON で生成してください。",
        experimental_telemetry: {
          isEnabled: true,
          functionId: "sim-summary",
          metadata: { traceId, kind },
        },
      });
      generatedReport = object;
    } catch (error) {
      console.warn("[Simulation] summary LLM failed:", error);
    }
  }

  return {
    promptKind: kind,
    interviewerSystemPrompt,
    interviewerModel,
    intervieweeModel,
    transcript,
    metrics: computeMetrics(transcript, askedQuestionIds, questionsCount),
    stopReason,
    elapsedMs: Date.now() - startedAt,
    generatedReport,
  };
}
