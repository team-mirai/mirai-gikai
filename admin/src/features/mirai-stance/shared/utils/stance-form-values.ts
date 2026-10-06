import {
  hasNewFormatReason,
  parseStanceSupplements,
} from "@mirai-gikai/shared/mirai-stance/reason-format";
import type { MiraiStance, StanceFormValues, StanceInput } from "../types";
import { resolvePublishAt, toJstDateTimeLocalValue } from "./publish-at-input";

export type ReasonFormat = "new" | "old";

// 新規入力時は「認める点 → 懸念 → 結論」の3行を用意しておく
const DEFAULT_REASON_POINT_COUNT = 3;

/**
 * 管理画面で最初に開く判断の理由の入力フォーマット。
 * 旧フォーマットのデータしかない場合のみ旧フォーマットを開き、それ以外は新フォーマットを開く。
 */
export function getInitialReasonFormat(
  stance: MiraiStance | null | undefined
): ReasonFormat {
  if (!stance || hasNewFormatReason(stance)) return "new";
  return stance.comment ? "old" : "new";
}

/** 保存済みスタンスからフォームの初期値を作る */
export function toStanceFormValues(
  stance: MiraiStance | null | undefined
): Partial<StanceFormValues> {
  const points = stance?.reason_points ?? [];
  return {
    type: stance?.type,
    comment: stance?.comment ?? "",
    reasonSummary: stance?.reason_summary ?? "",
    reasonPoints: (points.length > 0
      ? points
      : Array.from({ length: DEFAULT_REASON_POINT_COUNT }, () => "")
    ).map((value) => ({ value })),
    supplements: parseStanceSupplements(stance?.supplements),
    publishAtLocal: toJstDateTimeLocalValue(stance?.publish_at ?? null),
  };
}

/**
 * フォームの入力値を保存用の StanceInput に変換する。
 * 新旧どちらのフォーマットの入力も保持したまま保存する（表示時に新フォーマットを優先）。
 */
export function toStanceInput(
  { publishAtLocal, reasonPoints, ...values }: StanceFormValues,
  savedPublishAt: string | null
): StanceInput {
  return {
    ...values,
    reasonPoints: reasonPoints.map(({ value }) => value),
    publishAt: resolvePublishAt(publishAtLocal, savedPublishAt),
  };
}
