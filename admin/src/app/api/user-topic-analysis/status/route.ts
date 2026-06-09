import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getVersionStatus } from "@/features/user-topic-analysis/server/repositories/user-topic-analysis-repository";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** version の進捗ステータス（UI ポーリング用）。 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  const versionId = new URL(request.url).searchParams.get("versionId");
  if (!versionId) {
    return json({ error: "versionId is required" }, 400);
  }

  try {
    const status = await getVersionStatus(versionId);
    return json(status);
  } catch (error) {
    console.error("[UserTopicAnalysis] status failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "status failed" },
      500
    );
  }
}
