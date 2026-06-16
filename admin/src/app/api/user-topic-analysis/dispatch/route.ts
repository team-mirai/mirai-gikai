import {
  PROMPT_VERSION,
  TOPIC_MODEL,
} from "@mirai-gikai/topic-analysis-core/constants";
import {
  createVersion,
  findActiveVersionByBill,
  isStaleActiveVersion,
  updateVersionStatus,
} from "@mirai-gikai/topic-analysis-core/repository";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { executeTopicAnalysisJob } from "@/lib/cloud-run-job";

export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** ユーザー向けトピック分析の手動実行入口（Admin）。version 作成 → Cloud Run Job 起動。 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  let billId: string;
  let strategy: "full" | "incremental" = "full";
  try {
    const body: unknown = await request.json();
    const obj =
      typeof body === "object" && body !== null
        ? (body as { billId?: unknown; strategy?: unknown })
        : {};
    if (typeof obj.billId !== "string" || obj.billId.trim() === "") {
      return json({ error: "billId is required" }, 400);
    }
    billId = obj.billId.trim();
    if (obj.strategy !== undefined) {
      if (obj.strategy !== "full" && obj.strategy !== "incremental") {
        return json({ error: "strategy must be 'full' or 'incremental'" }, 400);
      }
      strategy = obj.strategy;
    }
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    // 二重起動防止（§5.3）: running/pending があればスキップ。
    // ただし Cloud Run 実行が worker 到達前に死んだ等で失効した行は failed に倒し、
    // 再実行をブロックし続けないようにする（pending/running のままの残骸を自己回復）。
    const active = await findActiveVersionByBill(billId);
    if (active) {
      if (isStaleActiveVersion(active, Date.now())) {
        await updateVersionStatus(
          active.id,
          "failed",
          "stale: execution did not start or did not complete in time"
        );
      } else {
        return json({ skipped: true, versionId: active.id, reason: "running" });
      }
    }

    // 事前チェックは TOCTOU で破れるため、createVersion は
    // one_active_version_per_bill の一意制約に弾かれたら null を返す。
    // 同時 POST で負けた側はここでスキップ扱いにする（原子的ガード）。
    const version = await createVersion(
      billId,
      "manual",
      TOPIC_MODEL,
      PROMPT_VERSION
    );
    if (!version) {
      return json({ skipped: true, reason: "running" });
    }

    try {
      await executeTopicAnalysisJob([
        "--mode=analyze",
        `--bill-id=${billId}`,
        `--version-id=${version.id}`,
        `--strategy=${strategy}`,
      ]);
    } catch (triggerError) {
      // ジョブ起動に失敗した場合は version を failed にして残骸（pending のまま）を防ぐ。
      const message =
        triggerError instanceof Error ? triggerError.message : "trigger failed";
      await updateVersionStatus(version.id, "failed", message);
      console.error("[UserTopicAnalysis] Failed to trigger job:", triggerError);
      return json({ error: message }, 502);
    }

    return json({ versionId: version.id });
  } catch (error) {
    console.error("[UserTopicAnalysis] dispatch failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      500
    );
  }
}
