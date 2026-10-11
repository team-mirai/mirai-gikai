import { isMiraiStancePublished } from "@mirai-gikai/shared/mirai-stance/publish-schedule";
import {
  type BillStatusEnum,
  getBillStatusLabel,
  HOUSE_LABELS,
  type HouseEnum,
  type MiraiStance,
  STANCE_LABELS,
} from "@/features/bills/shared/types";
import type {
  OpenDataBillDetail,
  OpenDataBillItem,
  OpenDataMiraiStance,
} from "../types/open-data-bills";

type OpenDataMiraiStanceRow = Pick<
  MiraiStance,
  "type" | "comment" | "publish_at"
>;

export type OpenDataBillRow = {
  id: string;
  name: string;
  status: BillStatusEnum;
  status_note: string | null;
  originating_house: HouseEnum;
  submitted_date: string | null;
  published_at: string | null;
  created_at: string;
  /** 難易度で絞り込み済みのため実質1件 */
  bill_contents: { title: string; summary: string }[];
  mirai_stances: OpenDataMiraiStanceRow | null;
  bills_tags: { tags: { id: string; label: string } | null }[];
};

/**
 * DBの議案行をオープンデータAPIのレスポンス項目に変換する。
 */
export function toOpenDataBillItem(
  row: OpenDataBillRow,
  now: Date
): OpenDataBillItem {
  const billContent = row.bill_contents[0];
  return {
    billId: row.id,
    name: row.name,
    title: billContent?.title ?? "",
    summary: billContent?.summary ?? "",
    status: row.status,
    statusLabel: getBillStatusLabel(row.status, row.originating_house),
    statusNote: row.status_note,
    originatingHouse: row.originating_house,
    originatingHouseLabel: HOUSE_LABELS[row.originating_house],
    submittedDate: row.submitted_date,
    publishedAt: row.published_at,
    tags: row.bills_tags.flatMap((billTag) =>
      billTag.tags ? [{ id: billTag.tags.id, label: billTag.tags.label }] : []
    ),
    miraiStance: toOpenDataMiraiStance(row.mirai_stances, now),
    createdAt: row.created_at,
  };
}

export type OpenDataBillDetailRow = Omit<OpenDataBillRow, "bill_contents"> & {
  bill_contents: { title: string; summary: string; content: string }[];
};

/**
 * DBの議案行（本文付き）をオープンデータAPIの詳細レスポンスに変換する。
 */
export function toOpenDataBillDetail(
  row: OpenDataBillDetailRow,
  now: Date
): OpenDataBillDetail {
  return {
    ...toOpenDataBillItem(row, now),
    content: row.bill_contents[0]?.content ?? "",
  };
}

/**
 * チームみらいの賛否行をレスポンス形式（日本語ラベル付き）に変換する。
 * 公開日時前の賛否は未設定（null）として扱う。
 */
export function toOpenDataMiraiStance(
  stance: OpenDataMiraiStanceRow | null,
  now: Date
): OpenDataMiraiStance | null {
  if (!stance || !isMiraiStancePublished(stance.publish_at, now)) return null;
  return {
    type: stance.type,
    label: STANCE_LABELS[stance.type],
    comment: stance.comment,
  };
}
