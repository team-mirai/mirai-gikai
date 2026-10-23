import {
  BILL_VIDEO_KINDS,
  type BillVideoKind,
} from "@mirai-gikai/shared/bill-videos/kinds";
import type { Database } from "@mirai-gikai/supabase";
import type { BillVideosInput } from "../types/bill-videos";

/**
 * 種類ごとの入力を、登録・更新する行と削除する種類に振り分ける
 */
export function toBillVideoChanges(billId: string, videos: BillVideosInput) {
  const upserts: Database["public"]["Tables"]["bill_videos"]["Insert"][] = [];
  const deleteKinds: BillVideoKind[] = [];

  for (const kind of BILL_VIDEO_KINDS) {
    const video = videos[kind];
    if (video === null) {
      deleteKinds.push(kind);
    } else {
      upserts.push({ bill_id: billId, kind, ...video });
    }
  }

  return { upserts, deleteKinds };
}
