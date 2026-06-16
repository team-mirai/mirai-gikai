import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { executeTopicAnalysisJob } from "@/lib/cloud-run-job";

export const maxDuration = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * 全議案トピック分析の手動実行入口（Admin）。
 * version は worker 側で議案ごとに作成するため、ここでは Cloud Run Job を起動するだけ。
 * 既定は incremental（差分）。1 実行で全議案を順次処理する。
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  // ボディは任意（空なら既定 incremental）。空文字以外は JSON として厳密に検証し、
  // 不正な JSON は高コストな副作用の前に 400 で弾く（握り潰して既定実行しない）。
  let strategy: "full" | "incremental" = "incremental";
  const text = await request.text();
  if (text.trim() !== "") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    if (typeof parsed !== "object" || parsed === null) {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const raw = (parsed as { strategy?: unknown }).strategy;
    if (raw !== undefined) {
      if (raw !== "full" && raw !== "incremental") {
        return json({ error: "strategy must be 'full' or 'incremental'" }, 400);
      }
      strategy = raw;
    }
  }

  try {
    await executeTopicAnalysisJob([
      "--mode=analyze-all",
      `--strategy=${strategy}`,
    ]);
    return json({ started: true, strategy });
  } catch (error) {
    console.error("[UserTopicAnalysis] dispatch-all failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      502
    );
  }
}
