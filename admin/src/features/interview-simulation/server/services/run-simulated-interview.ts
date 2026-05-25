import "server-only";

import { buildBulkModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/bulk-mode";
import { buildLoopModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/loop-mode";
import { buildSummarySystemPrompt } from "@mirai-gikai/shared/interview-prompts/summary";
import { buildTargetedModeSystemPrompt } from "@mirai-gikai/shared/interview-prompts/targeted-mode";
import type {
  InterviewMode,
  PromptBillInput,
  InterviewConfig as PromptInterviewConfig,
  InterviewQuestion as PromptInterviewQuestion,
} from "@mirai-gikai/shared/interview-prompts/types";
import { generateObject, generateText, type ModelMessage } from "ai";
import { z } from "zod";
import type { AiModel } from "@/lib/ai/models";
import {
  LLM_MAX_ATTEMPTS,
  LLM_TIMEOUT_MS,
  type PromptKind,
  SIMULATION_MAX_TURNS,
} from "../../shared/constants";
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
import { withTimeoutRetry } from "../../shared/utils/with-timeout-retry";

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
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  traceId: string;
  kind: PromptKind;
  /** 元インタビューから抽出した文体指標（省略可）。渡すとインタビュイー LLM の回答長を元会話レンジに寄せる */
  styleAnchors?: OriginalStyleAnchors;
  maxTurns?: number;
  /**
   * 本番と同じ builder を毎ターン呼んで system prompt を再構築するための素材。
   * handleInterviewChatRequest は毎ターン fresh に prompt をビルドし、bulk では
   * calculateNextQuestionId() の結果を nextQuestionId として渡す。
   * シミュでもこの挙動を揃える。
   */
  promptInputs: {
    bill: PromptBillInput;
    interviewConfig: PromptInterviewConfig;
    questions: PromptInterviewQuestion[];
    mode: InterviewMode;
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
   * インタビュー目安時間（分）。本番では毎ターン実時間ベースで残り時間を計算するが、
   * シミュでは元インタビューのターン数を基準に時間消費をシミュレートする。
   * null なら「## タイムマネジメント」セクションが出ない（本番と同じ挙動）。
   */
  estimatedDurationMinutes?: number | null;
  /** 各ターン完了時に呼ばれるコールバック（ストリーミング進捗用） */
  onTurnComplete?: (turnIndex: number, turn: SimulatedTurn) => void;
  /** クライアント abort 時に LLM 呼び出しも停止させる */
  signal?: AbortSignal;
}

/**
 * Bulk モードで「次に強制する質問」を計算する。
 * 本番の calculateNextQuestionId と同等: 未回答のうち定義順で最初の質問。
 */
function pickNextQuestionIdForBulk(
  questions: PromptInterviewQuestion[],
  askedQuestionIds: Set<string>
): string | undefined {
  return questions.find((q) => !askedQuestionIds.has(q.id))?.id;
}

const MODE_PROMPT_BUILDERS = {
  bulk: buildBulkModeSystemPrompt,
  loop: buildLoopModeSystemPrompt,
  targeted: buildTargetedModeSystemPrompt,
} as const satisfies Record<InterviewMode, unknown>;

/**
 * 本番と同じ builder を呼んで、現在のターンの system prompt を構築する。
 * 毎ターン fresh にビルドすることで、refresh によるセクション差し替え漏れを防ぐ。
 */
function buildInterviewerSystemPromptForTurn(
  promptInputs: RunSimulatedInterviewParams["promptInputs"],
  askedQuestionIds: Set<string>,
  remainingMinutes: number | null | undefined
): string {
  const builder = MODE_PROMPT_BUILDERS[promptInputs.mode];
  const nextQuestionId =
    promptInputs.mode === "bulk"
      ? pickNextQuestionIdForBulk(promptInputs.questions, askedQuestionIds)
      : undefined;
  return builder({
    bill: promptInputs.bill,
    interviewConfig: promptInputs.interviewConfig,
    questions: promptInputs.questions,
    currentStage: "chat",
    askedQuestionIds,
    remainingMinutes,
    nextQuestionId,
  });
}

function asInterviewerMessages(turns: SimulatedTurn[]): ModelMessage[] {
  // 本番と同じ挙動に合わせる: assistant メッセージはプレーンテキストのみ渡す。
  // JSON 全体（topic_title / question_id 等）を渡すと、LLM が過去の話題文脈を
  // 強く保持しすぎて深掘りが止まらなくなる。askedQuestionIds の進捗は
  // system prompt 側の「## ステージ遷移判定」セクションで LLM に伝える。
  return turns.map<ModelMessage>((t) => {
    if (t.role === "interviewer") {
      return { role: "assistant", content: t.content };
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
 * シミュレート上の残り時間（分）を算出する。
 * 本番は `estimated_duration - (now - session.started_at) / 60000` だが、
 * simでは実時間が数秒しか経過しないため、元インタビューのターン数を基準に
 * 時間消費をシミュレートする。
 *
 * turnIndex=0 で full time、turnIndex=expectedTurns で 0 になるよう線形補間。
 */
function calculateSimulatedRemainingMinutes(
  estimatedDuration: number,
  turnIndex: number,
  expectedTotalTurns: number
): number {
  if (expectedTotalTurns <= 0) return estimatedDuration;
  const minutesPerTurn = estimatedDuration / expectedTotalTurns;
  return Math.max(0, Math.ceil(estimatedDuration - turnIndex * minutesPerTurn));
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
  interviewerModel,
  intervieweeModel,
  traceId,
  kind,
  styleAnchors,
  maxTurns = SIMULATION_MAX_TURNS,
  promptInputs,
  summaryModel,
  initialTurnEnhancement,
  estimatedDurationMinutes,
  onTurnComplete,
  signal,
}: RunSimulatedInterviewParams): Promise<SimulationRun> {
  const questionsCount = promptInputs.questions.length;
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
  // タイムマネジメント用: 元インタビューのターン数を基準に残り時間をシミュレート
  const expectedTotalTurns =
    styleAnchors?.originalInterviewerTurns ?? questionsCount * 2;

  let stopReason: SimulationRun["stopReason"] = "max_turns";
  // 1 ターン目の system prompt を結果に残す（UI で system prompt 確認用）
  let firstTurnSystemPrompt = "";

  // インタビュアーがリードするので、ターンはペア単位 (interviewer + interviewee) で進む
  for (let turnIndex = 0; turnIndex < effectiveMaxTurns; turnIndex++) {
    // --- インタビュアーの発話 ---
    // 本番の handleInterviewChatRequest は毎ターン fresh に system prompt を
    // 再構築する。bulk では calculateNextQuestionId() で「次に強制する質問」を
    // 選び直すので、deep-dive や質問重複が構造的に避けられる仕組み。
    // シミュでも同じく毎ターン fresh ビルドする。
    const simulatedRemainingMinutes =
      estimatedDurationMinutes != null
        ? calculateSimulatedRemainingMinutes(
            estimatedDurationMinutes,
            turnIndex,
            expectedTotalTurns
          )
        : undefined;

    const interviewerSystemPromptForThisTurn =
      buildInterviewerSystemPromptForTurn(
        promptInputs,
        askedQuestionIds,
        simulatedRemainingMinutes
      );
    if (turnIndex === 0)
      firstTurnSystemPrompt = interviewerSystemPromptForThisTurn;

    let interviewerOutput: z.infer<typeof simInterviewerOutputSchema>;
    try {
      // 初回ターンは本番 generateInitialQuestion と同じ挙動にする。
      // 「## 重要: これはインタビューの開始です…」を system prompt 末尾に付与し、
      // messages は渡さず prompt 直渡しで呼び出す。
      const isInitialTurn = turnIndex === 0 && transcript.length === 0;
      if (isInitialTurn && initialTurnEnhancement) {
        const { billTitle, firstQuestionId } = initialTurnEnhancement;
        const enhancedPrompt = `${interviewerSystemPromptForThisTurn}\n\n## 重要: これはインタビューの開始です。ユーザーからのメッセージはありません。事前定義質問の最初の質問から始めてください。挨拶は温かく丁寧に（2文程度）、「${billTitle}」についてのインタビューであることを明確に伝えた上で、すぐに最初の質問をしてください。最初の質問にクイックリプライが設定されている場合は、必ず quick_replies フィールドに含めてください。${firstQuestionId ? `最初の質問は ID: ${firstQuestionId} であり、レスポンスの question_id にこの値を含めてください。` : ""}`;
        const { object } = await withTimeoutRetry(
          (attemptSignal) =>
            generateObject({
              model: interviewerModel,
              schema: simInterviewerOutputSchema,
              prompt: enhancedPrompt,
              abortSignal: attemptSignal,
              experimental_telemetry: {
                isEnabled: true,
                functionId: "sim-interviewer-initial",
                metadata: { traceId, kind, turnIndex: String(turnIndex) },
              },
            }),
          {
            externalSignal: signal,
            timeoutMs: LLM_TIMEOUT_MS.interviewTurn,
            maxAttempts: LLM_MAX_ATTEMPTS,
            label: "sim-interviewer-initial",
          }
        );
        interviewerOutput = object;
      } else {
        const messages = asInterviewerMessages(transcript);
        const { object } = await withTimeoutRetry(
          (attemptSignal) =>
            generateObject({
              model: interviewerModel,
              schema: simInterviewerOutputSchema,
              system: interviewerSystemPromptForThisTurn,
              messages,
              abortSignal: attemptSignal,
              experimental_telemetry: {
                isEnabled: true,
                functionId: "sim-interviewer",
                metadata: {
                  traceId,
                  kind,
                  turnIndex: String(turnIndex),
                },
              },
            }),
          {
            externalSignal: signal,
            timeoutMs: LLM_TIMEOUT_MS.interviewTurn,
            maxAttempts: LLM_MAX_ATTEMPTS,
            label: "sim-interviewer",
          }
        );
        interviewerOutput = object;
      }
    } catch (error) {
      // 外部 abort はユーザー操作のキャンセルなのでエラーログに載せない。
      // 呼び出し側 (pipeline) に伝播させて全体を止める
      if (signal?.aborted) {
        console.warn("[Simulation] interviewer LLM aborted");
        throw error;
      }
      console.error("[Simulation] interviewer LLM failed:", error);
      stopReason = "interviewer_error";
      break;
    }

    const interviewerQuickReplies =
      interviewerOutput.quick_replies &&
      interviewerOutput.quick_replies.length > 0
        ? interviewerOutput.quick_replies
        : null;
    const interviewerTurn: SimulatedTurn = {
      role: "interviewer",
      content: interviewerOutput.text,
      topic_title: interviewerOutput.topic_title ?? null,
      question_id: interviewerOutput.question_id ?? null,
      next_stage: interviewerOutput.next_stage ?? "chat",
      quick_replies: interviewerQuickReplies,
    };
    transcript.push(interviewerTurn);
    onTurnComplete?.(turnIndex, interviewerTurn);

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
      const { text } = await withTimeoutRetry(
        (attemptSignal) =>
          generateText({
            model: intervieweeModel,
            system: intervieweeSystemPrompt,
            messages,
            abortSignal: attemptSignal,
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
          }),
        {
          externalSignal: signal,
          timeoutMs: LLM_TIMEOUT_MS.interviewTurn,
          maxAttempts: LLM_MAX_ATTEMPTS,
          label: "sim-interviewee",
        }
      );
      const intervieweeTurn: SimulatedTurn = {
        role: "interviewee",
        content: text.trim(),
      };
      transcript.push(intervieweeTurn);
      onTurnComplete?.(turnIndex, intervieweeTurn);
    } catch (error) {
      // 外部 abort はユーザー操作のキャンセルなのでエラーログに載せない。
      // 呼び出し側 (pipeline) に伝播させて全体を止める
      if (signal?.aborted) {
        console.warn("[Simulation] interviewee LLM aborted");
        throw error;
      }
      console.error("[Simulation] interviewee LLM failed:", error);
      stopReason = "interviewee_error";
      break;
    }
  }

  // Summary フェーズ: summary/summary_complete への自然遷移 or max_turns 到達時に
  // 本番と同じ buildSummarySystemPrompt で Summary LLM を呼び、構造化レポートを生成する。
  // max_turns でも要約を生成することで、常にレポートが得られるようにする。
  let generatedReport: SimGeneratedReport | null = null;
  if (
    stopReason === "summary" ||
    stopReason === "summary_complete" ||
    stopReason === "max_turns"
  ) {
    try {
      const summaryMessages = transcript.map((t) => ({
        role: t.role === "interviewer" ? "assistant" : "user",
        content: t.content,
      }));
      const summarySystemPrompt = buildSummarySystemPrompt({
        bill: promptInputs.bill,
        interviewConfig: promptInputs.interviewConfig,
        messages: summaryMessages,
      });
      const { object } = await withTimeoutRetry(
        (attemptSignal) =>
          generateObject({
            model: summaryModel ?? interviewerModel,
            schema: simGeneratedReportSchema,
            system: summarySystemPrompt,
            prompt:
              "上記の会話履歴をもとに、スキーマに従ってレポートを JSON で生成してください。",
            abortSignal: attemptSignal,
            experimental_telemetry: {
              isEnabled: true,
              functionId: "sim-summary",
              metadata: { traceId, kind },
            },
          }),
        {
          externalSignal: signal,
          timeoutMs: LLM_TIMEOUT_MS.summary,
          maxAttempts: LLM_MAX_ATTEMPTS,
          label: "sim-summary",
        }
      );
      generatedReport = object;
    } catch (error) {
      console.warn("[Simulation] summary LLM failed:", error);
    }
  }

  return {
    promptKind: kind,
    interviewerSystemPrompt: firstTurnSystemPrompt,
    interviewerModel,
    intervieweeModel,
    transcript,
    metrics: computeMetrics(transcript, askedQuestionIds, questionsCount),
    stopReason,
    elapsedMs: Date.now() - startedAt,
    generatedReport,
  };
}
