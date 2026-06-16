import { generateObject } from "ai";
import { TOPIC_MODEL } from "../shared/constants";
import { topicJudgeSchema } from "../shared/schemas";
import type { BillContext, ExistingTopic, TopicDraft } from "../shared/types";
import { withRetry } from "../utils/concurrency";
import { toInlineText } from "../utils/to-inline-text";
import { buildJudgeNewTopicsPrompt } from "./prompts";

/** 採用候補番号(1始まり)を返す生成関数（テストで差し替え可能にDI）。 */
export type JudgeFn = (params: {
  prompt: string;
}) => Promise<{ accepted_indices: number[] }>;

const defaultJudge: JudgeFn = async ({ prompt }) => {
  const { object } = await withRetry(
    () =>
      generateObject({
        model: TOPIC_MODEL,
        schema: topicJudgeSchema,
        prompt,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "user-topic-analysis-judge-new-topics",
        },
      }),
    "judge-new-topics"
  );
  return object;
};

/**
 * 増分分析の差分判定。新規候補のうち、既存トピックと明確に異なり粒度も適切なものだけを
 * 「新規トピック」として採用して返す。判断が曖昧なものは採用しない（既存へ吸収させる）。
 * 既存トピックが無い、または候補が無い場合の扱いは呼び出し側で行う（この関数は候補>0前提）。
 */
export async function judgeNewTopics(
  candidates: TopicDraft[],
  existing: ExistingTopic[],
  bill: BillContext,
  deps: { judge?: JudgeFn } = {}
): Promise<TopicDraft[]> {
  if (candidates.length === 0) return [];
  // 既存が無ければ突き合わせ不要＝全候補が新規。
  if (existing.length === 0) return candidates;

  const judge = deps.judge ?? defaultJudge;
  const existingTopicsText = existing
    .map((t, i) => `${i + 1}. ${t.title} — ${toInlineText(t.description)}`)
    .join("\n");
  const candidatesText = candidates
    .map((t, i) => `${i + 1}. ${t.title} — ${toInlineText(t.description)}`)
    .join("\n");

  const { accepted_indices } = await judge({
    prompt: buildJudgeNewTopicsPrompt(bill, existingTopicsText, candidatesText),
  });

  // 1始まりの番号を候補配列の index に変換。非整数・範囲外・重複は無視する
  // （schema は緩く受け、ここで防御的に正規化する＝ZodError で pipeline を落とさない方針）。
  const seen = new Set<number>();
  const accepted: TopicDraft[] = [];
  for (const n of accepted_indices) {
    if (!Number.isInteger(n)) continue;
    const idx = n - 1;
    if (idx < 0 || idx >= candidates.length || seen.has(idx)) continue;
    seen.add(idx);
    accepted.push(candidates[idx]);
  }
  return accepted;
}
