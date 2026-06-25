import type { InterviewQuestionInput } from "../../shared/types";

/**
 * ドラッグ並び替え用に、各質問へクライアント側で安定したIDを付与した内部表現。
 * 保存時・親への受け渡し時は `_uid` を取り除いて {@link InterviewQuestionInput} に戻す。
 */
export type SortableQuestion = InterviewQuestionInput & { _uid: string };

/**
 * 質問に並び替え用の安定IDを付与する。
 * `crypto.randomUUID()` を用いるため、呼び出しごとに新しいIDが割り振られる。
 */
export function withUid(question: InterviewQuestionInput): SortableQuestion {
  return { ...question, _uid: crypto.randomUUID() };
}

/**
 * 並び替え用の `_uid` を取り除き、保存・送信用の {@link InterviewQuestionInput} に戻す。
 */
export function toInputs(items: SortableQuestion[]): InterviewQuestionInput[] {
  return items.map(({ _uid, ...rest }) => rest);
}
