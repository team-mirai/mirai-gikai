"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { parseBillCsv } from "../../shared/bill-csv";
import { findCsvImportReferences, importBills } from "../bill-csv-repository";

export type ImportBillsCsvResult =
  | { success: true; created: number; updated: number }
  | { success: false; error: string };

const MAX_CSV_SIZE = 10 * 1024 * 1024;

export async function importBillsCsv(
  formData: FormData
): Promise<ImportBillsCsvResult> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "CSVファイルを選択してください" };
    }
    if (file.size > MAX_CSV_SIZE) {
      return { success: false, error: "CSVファイルは10MB以内にしてください" };
    }

    const rows = parseBillCsv(await file.text());
    const requestedIds = rows
      .map((row) => row.id)
      .filter((id): id is string => id !== null);
    const { sessions, existingIds } =
      await findCsvImportReferences(requestedIds);

    const missingIds = requestedIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
      throw new Error(`DBに存在しないidがあります: ${missingIds.join(", ")}`);
    }

    const sessionBySlug = new Map(
      sessions
        .filter((session) => session.slug)
        .map((session) => [session.slug as string, session.id])
    );
    const unknownSessions = [
      ...new Set(
        rows
          .map((row) => row.sessionSlug)
          .filter((slug) => !sessionBySlug.has(slug))
      ),
    ];
    if (unknownSessions.length > 0) {
      throw new Error(
        `登録されていないsession_slugがあります: ${unknownSessions.join(", ")}`
      );
    }

    const now = new Date().toISOString();
    const ids = rows.map((row) => row.id ?? randomUUID());
    const bills = rows.map((row, index) => ({
      id: ids[index],
      name: row.name,
      status: row.status,
      status_note: row.statusNote,
      submitted_date: row.submittedDate
        ? `${row.submittedDate}T00:00:00+09:00`
        : null,
      publish_status: row.publishStatus,
      is_featured: row.isFeatured,
      is_review_completed: row.isReviewCompleted,
      originating_house: row.originatingHouse,
      diet_session_id: sessionBySlug.get(row.sessionSlug) as string,
      slug: row.slug,
      shugiin_url: row.sourceUrl,
      updated_at: now,
    }));
    const contents = rows.flatMap((row, index) => [
      {
        bill_id: ids[index],
        difficulty_level: "normal" as const,
        title: row.normalTitle,
        summary: row.normalSummary,
        content: row.normalContent,
        updated_at: now,
      },
      {
        bill_id: ids[index],
        difficulty_level: "hard" as const,
        title: row.hardTitle,
        summary: row.hardSummary,
        content: row.hardContent,
        updated_at: now,
      },
    ]);

    await importBills(bills, contents, existingIds);
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return {
      success: true,
      created: rows.length - existingIds.length,
      updated: existingIds.length,
    };
  } catch (error) {
    console.error("CSV import error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "CSVの取り込みに失敗しました"),
    };
  }
}
