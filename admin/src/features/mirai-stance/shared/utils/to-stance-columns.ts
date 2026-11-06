import {
  normalizeReasonPoints,
  normalizeStanceSupplements,
} from "@mirai-gikai/shared/mirai-stance/reason-format";
import type { StanceInput } from "../types";

/**
 * StanceInput を mirai_stances の書き込みカラムに変換する。
 * publishAt・isPublished・新フォーマットの各項目が undefined の場合はカラムを含めず、既存の値を保持する。
 * isPublished が false（非公開）の場合は publishAt に関わらず公開日時をリセットする。
 * isPublished が true（公開）の場合は公開確認が不要になるため公開確認日をリセットする。
 */
export function toStanceColumns(input: StanceInput) {
  return {
    type: input.type,
    comment: input.comment || null,
    ...(input.reasonSummary !== undefined && {
      reason_summary: input.reasonSummary.trim() || null,
    }),
    ...(input.reasonPoints !== undefined && {
      reason_points: normalizeReasonPoints(input.reasonPoints),
    }),
    ...(input.supplements !== undefined && {
      supplements: normalizeStanceSupplements(input.supplements),
    }),
    ...(input.isPublished !== undefined && { is_published: input.isPublished }),
    ...(input.isPublished === false
      ? { publish_at: null }
      : input.publishAt !== undefined && { publish_at: input.publishAt }),
    ...(input.isPublished === true
      ? { publish_review_date: null }
      : input.publishReviewDate !== undefined && {
          publish_review_date: input.publishReviewDate,
        }),
  };
}
