import { countPendingReextraction } from "@mirai-gikai/topic-analysis-core/repository";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { executeTopicAnalysisJob } from "@/lib/cloud-run-job";

export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * 意見再抽出バックフィルの入口（Admin 手動トリガ）。
 * 未処理レポートがあれば Cloud Run Job（backfill モード）を起動する。
 */
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const pending = await countPendingReextraction();
    if (pending === 0) {
      return json({ started: false, pending });
    }

    try {
      await executeTopicAnalysisJob(["--mode=backfill"]);
    } catch (triggerError) {
      const message =
        triggerError instanceof Error ? triggerError.message : "trigger failed";
      console.error("[OpinionBackfill] Failed to trigger job:", triggerError);
      return json({ error: message }, 502);
    }

    return json({ started: true, pending });
  } catch (error) {
    console.error("[OpinionBackfill] dispatch failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      500
    );
  }
}
