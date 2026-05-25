"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { buildInterviewTsv } from "../../shared/utils/build-interview-tsv";
import { getInterviewSessionsForTsv } from "../loaders/get-interview-sessions-for-tsv";
import { verifyConfigBelongsToBill } from "../services/verify-config-belongs-to-bill";

interface ExportInterviewTsvParams {
  configId: string;
  billId: string;
}

interface ExportInterviewTsvResult {
  success: boolean;
  tsv?: string;
  sessionCount?: number;
  error?: string;
}

export async function exportInterviewTsvAction(
  params: ExportInterviewTsvParams
): Promise<ExportInterviewTsvResult> {
  await requireAdmin();

  try {
    await verifyConfigBelongsToBill(params.configId, params.billId);
    const sessions = await getInterviewSessionsForTsv(params.configId);
    const tsv = buildInterviewTsv(sessions);
    return { success: true, tsv, sessionCount: sessions.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "TSVの出力に失敗しました",
    };
  }
}
