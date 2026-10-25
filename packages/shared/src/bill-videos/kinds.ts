import type { Database } from "@mirai-gikai/supabase";

export type BillVideoKind = Database["public"]["Enums"]["bill_video_kind"];

/** 議案ページ・編集フォームでの表示順 */
export const BILL_VIDEO_KINDS = [
  "stance_decision",
  "caucus",
] as const satisfies readonly BillVideoKind[];

export const BILL_VIDEO_KIND_LABELS: Record<BillVideoKind, string> = {
  stance_decision: "賛否を決めた時の議論",
  caucus: "議員団での議論",
};
