import {
  buildBulkModeStageGuidance,
  buildLoopModeStageGuidance,
} from "@mirai-gikai/shared/interview-prompts/stage-transition-guidance";
import type { InterviewQuestion } from "@mirai-gikai/shared/interview-prompts/types";

/**
 * ユーザーが編集した interviewer system prompt の末尾にある
 * 「## ステージ遷移判定」セクションを、**最新の askedQuestionIds** で再生成した
 * 内容に差し替える純粋関数。
 *
 * 本番の `buildInterviewSystemPrompt()` は毎ターン prompt を再構築して
 * 「完了した質問 / 未回答の質問」リストを更新するが、シミュはユーザーが
 * textarea で編集した固定文字列を system prompt として使うため、
 * このままでは LLM が毎ターン「0/N 完了、全問未回答」の状態を見続けてしまう。
 *
 * 本関数で動的な進捗セクションだけを差し替えることで、本番挙動と同じく
 * 毎ターン最新の進捗が LLM に伝わるようにする。
 *
 * ユーザーが編集した他のセクション（モード説明、深掘りテクニックなど）は保持される。
 */
const STAGE_GUIDANCE_MARKER = "## ステージ遷移判定";

export function refreshStageGuidance(params: {
  userSystemPrompt: string;
  askedQuestionIds: Set<string>;
  questions: InterviewQuestion[];
  mode: "loop" | "bulk";
}): string {
  const { userSystemPrompt, askedQuestionIds, questions, mode } = params;

  const build =
    mode === "bulk" ? buildBulkModeStageGuidance : buildLoopModeStageGuidance;
  const freshGuidance = build({
    currentStage: "chat",
    questions: questions.map((q) => ({ id: q.id, question: q.question })),
    askedQuestionIds,
  });

  const markerIndex = userSystemPrompt.indexOf(STAGE_GUIDANCE_MARKER);
  if (markerIndex === -1) {
    // マーカーが見当たらない（ユーザーが大幅に削除した等）ときは末尾に追記
    return `${userSystemPrompt.trimEnd()}\n\n${freshGuidance}`;
  }
  const base = userSystemPrompt.slice(0, markerIndex).trimEnd();
  return `${base}\n\n${freshGuidance}`;
}
