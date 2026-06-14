import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { findBillsForCsv } from "@/features/bills-csv/server/bill-csv-repository";
import {
  type BillCsvRow,
  serializeBillCsv,
} from "@/features/bills-csv/shared/bill-csv";

export async function GET() {
  await requireAdmin();

  const { bills, contents } = await findBillsForCsv();
  const rows: BillCsvRow[] = bills.map((bill) => {
    const normal = contents.find(
      (content) =>
        content.bill_id === bill.id && content.difficulty_level === "normal"
    );
    const hard = contents.find(
      (content) =>
        content.bill_id === bill.id && content.difficulty_level === "hard"
    );

    return {
      id: bill.id,
      name: bill.name,
      status: bill.status,
      statusNote: bill.status_note,
      submittedDate: bill.submitted_date?.slice(0, 10) ?? null,
      publishStatus: bill.publish_status,
      isFeatured: bill.is_featured,
      isReviewCompleted: bill.is_review_completed,
      originatingHouse: bill.originating_house,
      sessionSlug: bill.diet_sessions?.slug ?? "",
      slug: bill.slug,
      sourceUrl: bill.shugiin_url,
      normalTitle: normal?.title ?? "",
      normalSummary: normal?.summary ?? "",
      normalContent: normal?.content ?? "",
      hardTitle: hard?.title ?? normal?.title ?? "",
      hardSummary: hard?.summary ?? normal?.summary ?? "",
      hardContent: hard?.content ?? normal?.content ?? "",
    };
  });

  return new Response(serializeBillCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="kusatsu-city-council-bills.csv"',
      "Cache-Control": "no-store",
    },
  });
}
