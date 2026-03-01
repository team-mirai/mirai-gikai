import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { runTopicAnalysis } from "@/features/topic-analysis/server/services/topic-analysis-orchestrator";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { billId } = body as { billId: string };

  if (!billId) {
    return new Response(JSON.stringify({ error: "billId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await runTopicAnalysis(billId);

    return new Response(
      JSON.stringify({ success: true, versionId: result.versionId }),
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
