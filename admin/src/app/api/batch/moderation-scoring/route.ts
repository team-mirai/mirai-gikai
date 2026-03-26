import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { runBatchModerationScoring } from "@/features/interview-reports/server/services/batch-moderation-scoring";

export const maxDuration = 300;

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await runBatchModerationScoring();

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
