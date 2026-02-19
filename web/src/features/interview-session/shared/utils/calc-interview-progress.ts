import type { InterviewStage } from "../schemas";

export interface InterviewProgress {
  percentage: number;
  currentTopic: string | null;
  showSkip: boolean;
}

interface ProgressMessage {
  role: "assistant" | "user";
  questionId?: string | null;
  topicTitle?: string | null;
}

/**
 * インタビューのプログレスバー進捗を計算する純粋関数
 *
 * - summary_complete: 100%
 * - summary: 90% 固定
 * - chat: 完了質問数 / 全質問数 x 80%（残り20%はsummary+summary_complete）
 *
 * currentTopic は全ステージ共通で最後のトピック名を返す。
 */
export function calcInterviewProgress(
  totalQuestions: number | undefined,
  stage: InterviewStage,
  messages: ProgressMessage[]
): InterviewProgress | null {
  if (!totalQuestions || totalQuestions === 0) return null;

  // 全ステージ共通: 最後のトピック名を取得
  const lastTopicMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.topicTitle);
  const currentTopic = lastTopicMessage?.topicTitle ?? null;

  if (stage === "summary_complete") {
    return { percentage: 100, currentTopic, showSkip: false };
  }

  if (stage === "summary") {
    return { percentage: 90, currentTopic, showSkip: false };
  }

  // chat: 質問ベースの進捗
  const askedIds = new Set(
    messages
      .filter((m) => m.role === "assistant" && m.questionId)
      .map((m) => m.questionId as string)
  );
  // 現在聞いている質問は「完了」ではないので除外
  const completedCount = Math.max(0, askedIds.size - 1);
  // chatステージでは最大80%まで
  const percentage = Math.round((completedCount / totalQuestions) * 80);

  return { percentage, currentTopic, showSkip: true };
}
