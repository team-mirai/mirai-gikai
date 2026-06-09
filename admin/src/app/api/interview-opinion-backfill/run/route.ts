import { after } from "next/server";
import { runOpinionBackfillChunk } from "@/features/interview-opinion-backfill/server/services/run-opinion-backfill-chunk";
import {
  triggerBackfillRun,
  verifyBackfillInternalAuth,
} from "@/features/interview-opinion-backfill/server/utils/trigger-backfill-run";
import { registerNodeTelemetry } from "@/lib/telemetry/register";

export const maxDuration = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * 1チャンク分を処理し、未処理が残れば自己再トリガする（内部呼び出し専用）。
 * 重い処理は after() でレスポンス後に実行し、各リクエストは即座に返す。
 */
export async function POST(request: Request) {
  try {
    verifyBackfillInternalAuth(request);
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  after(async () => {
    try {
      await registerNodeTelemetry();
      const result = await runOpinionBackfillChunk();
      console.log("[OpinionBackfill] chunk processed:", result);
      // 「前進した行（成功＋スキップ）」がある場合のみ次チャンクを起動する。
      // 失敗行はウォーターマークを進めず未処理のまま残るため、チャンクが全失敗
      // （前進ゼロ）になったら停止し、永続失敗による無限ループを防ぐ。
      const advanced = result.updated + result.skipped;
      if (result.remaining > 0 && advanced > 0) {
        await triggerBackfillRun();
      } else if (result.remaining > 0) {
        console.warn(
          `[OpinionBackfill] Stopping: ${result.remaining} reports remain but chunk made no progress (failed=${result.failed}).`
        );
      }
    } catch (error) {
      console.error("[OpinionBackfill] run chunk failed:", error);
    }
  });

  return json({ accepted: true });
}
