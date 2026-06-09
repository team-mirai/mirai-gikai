import { getVersionStatus } from "@mirai-gikai/topic-analysis-core/repository";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // UI ポーリング用途のため古いステータスを返さないようキャッシュを抑止する。
      "Cache-Control": "no-store",
    },
  });

/** version の進捗ステータス（UI ポーリング用）。 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  const rawVersionId = new URL(request.url).searchParams.get("versionId");
  const versionId = rawVersionId?.trim();
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
