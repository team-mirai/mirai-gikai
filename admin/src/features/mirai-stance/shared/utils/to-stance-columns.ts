import {
  normalizeReasonPoints,
  normalizeStanceSupplements,
} from "@mirai-gikai/shared/mirai-stance/reason-format";
import type { StanceInput } from "../types";

/**
 * StanceInput を mirai_stances の書き込みカラムに変換する。
 * publishAt・新フォーマットの各項目が undefined の場合はカラムを含めず、既存の値を保持する。
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
    ...(input.publishAt !== undefined && { publish_at: input.publishAt }),
  };
}
