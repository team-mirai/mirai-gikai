import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { findVersionById } from "@/features/topic-analysis/server/repositories/topic-analysis-repository";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");

  if (!versionId) {
    return new Response(JSON.stringify({ error: "versionId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const version = await findVersionById(versionId);

    if (!version) {
      return new Response(JSON.stringify({ error: "Version not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        status: version.status,
        currentStep: version.current_step,
        startedAt: version.started_at,
        completedAt: version.completed_at,
        errorMessage: version.error_message,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[TopicAnalysis] Status check failed:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
