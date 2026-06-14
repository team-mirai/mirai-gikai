import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findBillsForCsv() {
  const supabase = createAdminClient();
  const [
    { data: bills, error: billsError },
    { data: contents, error: contentsError },
  ] = await Promise.all([
    supabase
      .from("bills")
      .select("*, diet_sessions(slug)")
      .order("submitted_date", { ascending: true }),
    supabase.from("bill_contents").select("*"),
  ]);

  if (billsError) throw billsError;
  if (contentsError) throw contentsError;

  return { bills: bills ?? [], contents: contents ?? [] };
}

export async function importBills(
  rows: Array<{
    id: string;
    name: string;
    status:
      | "preparing"
      | "introduced"
      | "in_originating_house"
      | "in_receiving_house"
      | "enacted"
      | "rejected";
    status_note: string | null;
    submitted_date: string | null;
    publish_status: "draft" | "published" | "coming_soon";
    is_featured: boolean;
    is_review_completed: boolean;
    originating_house: "HR" | "HC";
    diet_session_id: string;
    slug: string | null;
    shugiin_url: string | null;
    updated_at: string;
  }>,
  contents: Array<{
    bill_id: string;
    difficulty_level: "normal" | "hard";
    title: string;
    summary: string;
    content: string;
    updated_at: string;
  }>,
  existingIds: string[]
) {
  const supabase = createAdminClient();
  const newIds = rows
    .map((row) => row.id)
    .filter((id) => !existingIds.includes(id));

  const [
    { data: previousBills, error: previousBillsError },
    { data: previousContents, error: previousContentsError },
  ] = await Promise.all([
    existingIds.length > 0
      ? supabase.from("bills").select("*").in("id", existingIds)
      : Promise.resolve({ data: [], error: null }),
    existingIds.length > 0
      ? supabase.from("bill_contents").select("*").in("bill_id", existingIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (previousBillsError) throw previousBillsError;
  if (previousContentsError) throw previousContentsError;

  const { error: billsError } = await supabase
    .from("bills")
    .upsert(rows, { onConflict: "id" });
  if (billsError) throw billsError;

  const { error: contentsError } = await supabase
    .from("bill_contents")
    .upsert(contents, { onConflict: "bill_id,difficulty_level" });

  if (!contentsError) return;

  if (newIds.length > 0) {
    await supabase.from("bills").delete().in("id", newIds);
  }
  if (previousBills && previousBills.length > 0) {
    await supabase.from("bills").upsert(previousBills, { onConflict: "id" });
  }
  if (previousContents && previousContents.length > 0) {
    await supabase.from("bill_contents").upsert(previousContents, {
      onConflict: "bill_id,difficulty_level",
    });
  }

  throw contentsError;
}

export async function findCsvImportReferences(ids: string[]) {
  const supabase = createAdminClient();
  const [
    { data: sessions, error: sessionsError },
    { data: existingBills, error: billsError },
  ] = await Promise.all([
    supabase.from("diet_sessions").select("id, slug"),
    ids.length > 0
      ? supabase.from("bills").select("id").in("id", ids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sessionsError) throw sessionsError;
  if (billsError) throw billsError;

  return {
    sessions: sessions ?? [],
    existingIds: (existingBills ?? []).map((bill) => bill.id),
  };
}
