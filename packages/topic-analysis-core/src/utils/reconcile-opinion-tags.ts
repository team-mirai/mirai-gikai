import { normalizeReasoningTypes } from "@mirai-gikai/shared/interview-report/opinion-tags";
import type { OpinionTagsUpdate } from "../repositories/opinion-tags-repository";

/**
 * LLM が返したタグ1件（正規化前）。
 * reasoning_types は未知の値を落とすのがこの関数の役目なので、
 * zod 通過後の enum union ではなく素の string[] を受ける。
 */
export type RawOpinionTags = {
  opinion_index: number;
  concern: string | null;
  proposal: string | null;
  reasoning_types: readonly string[] | null;
};

export type ReconcileResult = {
  /** 書き込むタグ。 */
  updates: OpinionTagsUpdate[];
  /**
   * LLM が返さなかった意見の opinion_index。
   * ウォーターマークだけ進めて滞留を防ぐ対象（タグは NULL のまま残る）。
   */
  missingIndexes: number[];
};

/**
 * 依頼した意見と LLM が返したタグを opinion_index で突き合わせる純粋関数。
 *
 * - 依頼していない opinion_index が返ってきたら捨てる（別レポートの意見を汚さない）
 * - 同じ index が重複したら最初の1件を採用する
 * - 返ってこなかった index は missingIndexes に入れる
 * - reasoning_types は未知の値を落として正規化する
 */
export function reconcileOpinionTags(
  requestedIndexes: number[],
  returned: readonly RawOpinionTags[]
): ReconcileResult {
  const requested = new Set(requestedIndexes);
  const byIndex = new Map<number, RawOpinionTags>();

  for (const tag of returned) {
    if (!requested.has(tag.opinion_index)) continue;
    if (byIndex.has(tag.opinion_index)) continue;
    byIndex.set(tag.opinion_index, tag);
  }

  const updates: OpinionTagsUpdate[] = [];
  const missingIndexes: number[] = [];

  for (const opinionIndex of requestedIndexes) {
    const tag = byIndex.get(opinionIndex);
    if (!tag) {
      missingIndexes.push(opinionIndex);
      continue;
    }
    updates.push({
      opinionIndex,
      concern: emptyToNull(tag.concern),
      proposal: emptyToNull(tag.proposal),
      reasoningTypes: normalizeReasoningTypes(tag.reasoning_types),
    });
  }

  return { updates, missingIndexes };
}

/** 空文字・空白のみは null に寄せる（「懸念なし」を空文字で返すモデルがあるため）。 */
function emptyToNull(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
