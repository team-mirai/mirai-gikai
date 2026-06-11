import { resolveBackfillParams } from "@mirai-gikai/topic-analysis-core/backfill-params";
import {
  countAllReports,
  countPendingReextraction,
} from "@mirai-gikai/topic-analysis-core/repository";
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
 * リクエストボディで議案スコープ（billId）・対象範囲（scope）を指定できる。
 * 対象レポートがあれば Cloud Run Job（backfill モード）を起動する。
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { billId?: string; scope?: string } = {};
  try {
    body = (await request.json()) as { billId?: string; scope?: string };
  } catch {
    // ボディ無し（旧クライアント互換）は既定値（全議案・未再抽出）として扱う。
  }

  const resolved = resolveBackfillParams({
    billId: body.billId,
    scope: body.scope,
  });
  if (!resolved.ok) {
    return json({ error: resolved.error }, 400);
  }
  const { billId, scope } = resolved.params;

  try {
    // 対象件数を確認し、0 件なら起動しない。
    // pending は未再抽出件数、all は議案の全レポート件数を見る。
    const pending =
      scope === "all"
        ? await countAllReports(billId)
        : await countPendingReextraction(billId);
    if (pending === 0) {
      return json({ started: false, pending });
    }

    const args = ["--mode=backfill", `--scope=${scope}`];
    if (billId) {
      args.push(`--bill-id=${billId}`);
    }

    try {
      await executeTopicAnalysisJob(args);
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
