import { executePhase1 } from "@/features/topic-analysis/server/services/topic-analysis-orchestrator";
import { updateVersionStatus } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
import {
  triggerNextPhase,
  verifyInternalAuth,
} from "@/features/topic-analysis/server/utils/trigger-next-phase";
import { registerNodeTelemetry } from "@/lib/telemetry/register";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    verifyInternalAuth(request);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let versionId: string;
  let billId: string;
  try {
    const body = await request.json();
    versionId = body.versionId;
    billId = body.billId;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await registerNodeTelemetry();
    await executePhase1(versionId, billId);
    await triggerNextPhase(2, versionId, billId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[TopicAnalysis] Phase 1 failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Phase 1 failed";
    await updateVersionStatus(versionId, "failed", errorMessage).catch((e) =>
      console.error("[TopicAnalysis] Failed to update status:", e)
    );
    return new Response(JSON.stringify({ error: "Phase 1 failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
