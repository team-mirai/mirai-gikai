import { after } from "next/server";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  createVersion,
  findActiveVersionByBill,
} from "@/features/user-topic-analysis/server/repositories/user-topic-analysis-repository";
import { triggerStep } from "@/features/user-topic-analysis/server/utils/trigger-step";
import {
  PROMPT_VERSION,
  TOPIC_MODEL,
} from "@/features/user-topic-analysis/shared/constants";

export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** ユーザー向けトピック分析の手動実行入口（Admin）。version 作成 → extract 起動。 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  let billId: string;
  try {
    billId = (await request.json()).billId;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!billId) {
    return json({ error: "billId is required" }, 400);
  }

  try {
    // 二重起動防止（§5.3）: running/pending があればスキップ
    const active = await findActiveVersionByBill(billId);
    if (active) {
      return json({ skipped: true, versionId: active.id, reason: "running" });
    }

    const version = await createVersion(
      billId,
      "manual",
      TOPIC_MODEL,
      PROMPT_VERSION
    );

    after(async () => {
      try {
        await triggerStep("extract", version.id, billId);
      } catch (error) {
        // 起動 fetch のレスポンス喪失等は extract が走っている可能性があり曖昧。
        // 誤って failed にして多重起動を招かないようログのみ（best-effort 連鎖）。
        console.error("[UserTopicAnalysis] Failed to start extract:", error);
      }
    });

    return json({ versionId: version.id });
  } catch (error) {
    console.error("[UserTopicAnalysis] dispatch failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      500
    );
  }
}
