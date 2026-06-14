import fs from "node:fs/promises";
import path from "node:path";
import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "../shared/helper";
import { parseBillUpdateCsv } from "./bill-update-csv";

type BillRow = Database["public"]["Tables"]["bills"]["Row"];
type BillContentRow =
  Database["public"]["Tables"]["bill_contents"]["Row"];

const CSV_PATH = path.resolve(
  import.meta.dirname,
  "data",
  "bills-update.csv"
);
const BACKUP_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  ".local-data",
  "kusatsu-backups"
);

interface Backup {
  createdAt: string;
  bills: BillRow[];
  billContents: BillContentRow[];
}

async function fetchExistingData(ids: string[]) {
  const supabase = createAdminClient();
  const { data: bills, error: billsError } = await supabase
    .from("bills")
    .select("*")
    .in("id", ids);
  if (billsError) throw billsError;

  const { data: billContents, error: contentsError } = await supabase
    .from("bill_contents")
    .select("*")
    .in("bill_id", ids);
  if (contentsError) throw contentsError;

  return { supabase, bills, billContents };
}

function validateExistingData(
  ids: string[],
  bills: BillRow[],
  contents: BillContentRow[]
) {
  const existingIds = new Set(bills.map((bill) => bill.id));
  const missingIds = ids.filter((id) => !existingIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(`DBに存在しない議案IDがあります: ${missingIds.join(", ")}`);
  }

  for (const id of ids) {
    const billContents = contents.filter((content) => content.bill_id === id);
    const normalCount = billContents.filter(
      (content) => content.difficulty_level === "normal"
    ).length;
    const hardCount = billContents.filter(
      (content) => content.difficulty_level === "hard"
    ).length;
    if (normalCount !== 1 || hardCount !== 1) {
      throw new Error(
        `${id}: normal/hard の本文がそれぞれ1件ずつ必要です`
      );
    }
  }
}

async function restoreBackup(
  supabase: ReturnType<typeof createAdminClient>,
  backup: Backup
) {
  for (const bill of backup.bills) {
    const { error } = await supabase.from("bills").update(bill).eq("id", bill.id);
    if (error) throw error;
  }
  for (const content of backup.billContents) {
    const { error } = await supabase
      .from("bill_contents")
      .update(content)
      .eq("id", content.id);
    if (error) throw error;
  }
}

async function updateBills() {
  const apply = process.argv.includes("--apply");
  const csv = await fs.readFile(CSV_PATH, "utf8");
  const rows = parseBillUpdateCsv(csv);
  const ids = rows.map((row) => row.id);
  const { supabase, bills, billContents } = await fetchExistingData(ids);

  validateExistingData(ids, bills, billContents);
  console.log(`Validated ${rows.length} bills.`);

  if (!apply) {
    console.log("Dry run only. Add --apply to update the database.");
    return;
  }

  const createdAt = new Date().toISOString();
  const backup: Backup = { createdAt, bills, billContents };
  const backupPath = path.join(
    BACKUP_DIR,
    `${createdAt.replaceAll(":", "-")}.json`
  );
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Backup saved to ${backupPath}`);

  try {
    for (const row of rows) {
      const { error: billError } = await supabase
        .from("bills")
        .update({
          name: row.name,
          status: row.status,
          status_note: row.statusNote,
          submitted_date: row.submittedDate,
          publish_status: row.publishStatus,
          is_featured: row.isFeatured,
          slug: row.slug,
          shugiin_url: row.sourceUrl,
          updated_at: createdAt,
        })
        .eq("id", row.id);
      if (billError) throw billError;

      for (const level of ["normal", "hard"] as const) {
        const { error: contentError } = await supabase
          .from("bill_contents")
          .update({
            title: level === "normal" ? row.normalTitle : row.hardTitle,
            summary: level === "normal" ? row.normalSummary : row.hardSummary,
            content: level === "normal" ? row.normalContent : row.hardContent,
            updated_at: createdAt,
          })
          .eq("bill_id", row.id)
          .eq("difficulty_level", level);
        if (contentError) throw contentError;
      }
    }
  } catch (error) {
    console.error("Update failed. Restoring the backup...");
    await restoreBackup(supabase, backup);
    throw error;
  }

  console.log(`Updated ${rows.length} bills successfully.`);
}

updateBills().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
