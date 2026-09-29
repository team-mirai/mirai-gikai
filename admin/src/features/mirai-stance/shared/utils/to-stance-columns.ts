import type { StanceInput } from "../types";

/**
 * StanceInput を mirai_stances の書き込みカラムに変換する。
 * publishAt が undefined の場合は publish_at を含めず、既存の公開日時を保持する。
 */
export function toStanceColumns(input: StanceInput) {
  return {
    type: input.type,
    comment: input.comment || null,
    ...(input.publishAt !== undefined && { publish_at: input.publishAt }),
  };
}
