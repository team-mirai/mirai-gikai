import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "../shared/helper";
import {
  serializeBillUpdateCsv,
  type BillUpdateRow,
} from "./bill-update-csv";

const OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  "data",
  "bills-update.csv"
);

async function exportBills() {
  const supabase = createAdminClient();
  const { data: bills, error: billsError } = await supabase
    .from("bills")
    .select("*")
    .order("name");

  if (billsError) throw billsError;

  const { data: contents, error: contentsError } = await supabase
    .from("bill_contents")
    .select("*");

  if (contentsError) throw contentsError;

  const rows: BillUpdateRow[] = bills.map((bill) => {
    const normal = contents.find(
      (content) =>
        content.bill_id === bill.id && content.difficulty_level === "normal"
    );
    const hard = contents.find(
      (content) =>
        content.bill_id === bill.id && content.difficulty_level === "hard"
    );

    if (!normal || !hard) {
      throw new Error(`${bill.name}: normal/hard の本文が揃っていません`);
    }

    return {
      id: bill.id,
      name: bill.name,
      status: bill.status,
      statusNote: bill.status_note,
      submittedDate: bill.submitted_date,
      publishStatus: bill.publish_status,
      isFeatured: bill.is_featured,
      slug: bill.slug,
      sourceUrl: bill.shugiin_url,
      normalTitle: normal.title,
      normalSummary: normal.summary,
      normalContent: normal.content,
      hardTitle: hard.title,
      hardSummary: hard.summary,
      hardContent: hard.content,
    };
  });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, serializeBillUpdateCsv(rows), "utf8");
  console.log(`Exported ${rows.length} bills to ${OUTPUT_PATH}`);
}

exportBills().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
