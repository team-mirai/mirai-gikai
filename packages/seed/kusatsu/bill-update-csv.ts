import { parse } from "csv-parse/sync";
import type { Database } from "@mirai-gikai/supabase";

type BillStatus = Database["public"]["Enums"]["bill_status_enum"];
type PublishStatus = Database["public"]["Enums"]["bill_publish_status"];

export const BILL_UPDATE_COLUMNS = [
  "id",
  "name",
  "status",
  "status_note",
  "submitted_date",
  "publish_status",
  "is_featured",
  "slug",
  "source_url",
  "normal_title",
  "normal_summary",
  "normal_content",
  "hard_title",
  "hard_summary",
  "hard_content",
] as const;

export interface BillUpdateRow {
  id: string;
  name: string;
  status: BillStatus;
  statusNote: string | null;
  submittedDate: string | null;
  publishStatus: PublishStatus;
  isFeatured: boolean;
  slug: string | null;
  sourceUrl: string | null;
  normalTitle: string;
  normalSummary: string;
  normalContent: string;
  hardTitle: string;
  hardSummary: string;
  hardContent: string;
}

const BILL_STATUSES = new Set<BillStatus>([
  "introduced",
  "in_originating_house",
  "in_receiving_house",
  "enacted",
  "rejected",
  "preparing",
]);

const PUBLISH_STATUSES = new Set<PublishStatus>([
  "draft",
  "published",
  "coming_soon",
]);

function required(value: string | undefined, column: string, row: number) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${row}行目: ${column} は必須です`);
  }
  return normalized;
}

function nullable(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseBoolean(value: string | undefined, row: number) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${row}行目: is_featured は true または false にしてください`);
}

function parseStatus(value: string | undefined, row: number) {
  const normalized = required(value, "status", row) as BillStatus;
  if (!BILL_STATUSES.has(normalized)) {
    throw new Error(`${row}行目: status の値が不正です: ${normalized}`);
  }
  return normalized;
}

function parsePublishStatus(value: string | undefined, row: number) {
  const normalized = required(
    value,
    "publish_status",
    row
  ) as PublishStatus;
  if (!PUBLISH_STATUSES.has(normalized)) {
    throw new Error(
      `${row}行目: publish_status の値が不正です: ${normalized}`
    );
  }
  return normalized;
}

export function parseBillUpdateCsv(csv: string): BillUpdateRow[] {
  const records = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    throw new Error("更新対象の議案がありません");
  }

  const ids = new Set<string>();
  return records.map((record, index) => {
    const row = index + 2;
    const id = required(record.id, "id", row);
    if (ids.has(id)) {
      throw new Error(`${row}行目: id が重複しています: ${id}`);
    }
    ids.add(id);

    return {
      id,
      name: required(record.name, "name", row),
      status: parseStatus(record.status, row),
      statusNote: nullable(record.status_note),
      submittedDate: nullable(record.submitted_date),
      publishStatus: parsePublishStatus(record.publish_status, row),
      isFeatured: parseBoolean(record.is_featured, row),
      slug: nullable(record.slug),
      sourceUrl: nullable(record.source_url),
      normalTitle: required(record.normal_title, "normal_title", row),
      normalSummary: required(record.normal_summary, "normal_summary", row),
      normalContent: required(record.normal_content, "normal_content", row),
      hardTitle: required(record.hard_title, "hard_title", row),
      hardSummary: required(record.hard_summary, "hard_summary", row),
      hardContent: required(record.hard_content, "hard_content", row),
    };
  });
}

function escapeCsvValue(value: string | boolean | null) {
  if (value === null) return "";
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeBillUpdateCsv(rows: BillUpdateRow[]) {
  const header = BILL_UPDATE_COLUMNS.join(",");
  const lines = rows.map((row) =>
    [
      row.id,
      row.name,
      row.status,
      row.statusNote,
      row.submittedDate,
      row.publishStatus,
      row.isFeatured,
      row.slug,
      row.sourceUrl,
      row.normalTitle,
      row.normalSummary,
      row.normalContent,
      row.hardTitle,
      row.hardSummary,
      row.hardContent,
    ]
      .map(escapeCsvValue)
      .join(",")
  );
  return `${header}\n${lines.join("\n")}\n`;
}
