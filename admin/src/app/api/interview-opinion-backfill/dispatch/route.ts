import { after } from "next/server";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { countPendingReextraction } from "@/features/interview-opinion-backfill/server/repositories/interview-opinion-backfill-repository";
import { triggerBackfillRun } from "@/features/interview-opinion-backfill/server/utils/trigger-backfill-run";

export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * 意見再抽出バックフィルの入口（Admin 手動トリガ）。
 * 未処理レポートがあれば run をバックグラウンドで起動する。
 */
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const pending = await countPendingReextraction();
    if (pending > 0) {
      after(async () => {
        try {
          await triggerBackfillRun();
        } catch (error) {
          console.error("[OpinionBackfill] Failed to start run:", error);
        }
      });
    }
    return json({ started: pending > 0, pending });
  } catch (error) {
    console.error("[OpinionBackfill] dispatch failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      500
    );
  }
}
