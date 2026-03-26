import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { runBatchModerationScoringChunk } from "@/features/interview-reports/server/services/batch-moderation-scoring";

export const maxDuration = 300;

const MAX_CHUNK_SIZE = 100;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const reportIds: unknown = body.reportIds;

    if (
      !Array.isArray(reportIds) ||
      reportIds.length === 0 ||
      !reportIds.every((id) => typeof id === "string")
    ) {
      return new Response(
        JSON.stringify({
          error: "reportIds must be a non-empty array of strings",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (reportIds.length > MAX_CHUNK_SIZE) {
      return new Response(
        JSON.stringify({
          error: `reportIds must not exceed ${MAX_CHUNK_SIZE} items`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validatedIds = reportIds as string[];
    const result = await runBatchModerationScoringChunk(validatedIds);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[BatchModeration] API error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "モデレーション一括評価に失敗しました",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
