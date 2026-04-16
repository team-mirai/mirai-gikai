import type { SimulatedTurn } from "../schemas";

/**
 * 会話ターン配列を比較表示用の Markdown に整形する純粋関数
 *
 * - インタビュアーターンは "**インタビュアー**: ..." と表示
 * - インタビュイーターンは "**インタビュイー**: ..." と表示
 * - topic_title / question_id / next_stage はバッジとして付与
 */
export function formatTranscriptToMarkdown(turns: SimulatedTurn[]): string {
  if (turns.length === 0) {
    return "_（会話なし）_";
  }
  return turns
    .map((turn, index) => {
      const labelKana =
        turn.role === "interviewer" ? "インタビュアー" : "インタビュイー";
      const meta: string[] = [];
      if (turn.topic_title) meta.push(`topic: ${turn.topic_title}`);
      if (turn.question_id) meta.push(`q: ${turn.question_id}`);
      if (turn.next_stage && turn.next_stage !== "chat") {
        meta.push(`next: ${turn.next_stage}`);
      }
      const metaLine = meta.length > 0 ? ` _(${meta.join(" / ")})_` : "";
      return `**${index + 1}. ${labelKana}**${metaLine}\n\n${turn.content}`;
    })
    .join("\n\n---\n\n");
}

/**
 * テキストが「短答」かどうかを判定（メトリクス用）
 */
export function isShortAnswer(text: string): boolean {
  return text.trim().length <= 15;
}
