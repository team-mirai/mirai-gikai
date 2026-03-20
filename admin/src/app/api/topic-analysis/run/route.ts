import { after } from "next/server";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { createVersion } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";
import { executeAnalysisPipeline } from "@/features/topic-analysis/server/services/topic-analysis-orchestrator";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let billId: string;
  try {
    const body = await request.json();
    billId = body.billId;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!billId) {
    return new Response(JSON.stringify({ error: "billId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const version = await createVersion(billId);

    after(async () => {
      try {
        await executeAnalysisPipeline(version.id, billId);
      } catch (error) {
        console.error("[TopicAnalysis] Pipeline failed:", error);
      }
    });

    return new Response(
      JSON.stringify({ success: true, versionId: version.id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Topic analysis failed:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "解析に失敗しました",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
