import {
  countAllReports,
  countPendingReextraction,
} from "@mirai-gikai/topic-analysis-core/repository";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // 進捗ポーリングで古い件数が返らないようキャッシュを抑止する。
      "Cache-Control": "no-store",
    },
  });

/** 進捗（未処理件数 / 全件数）を返す。UI のポーリング用。 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const [pending, total] = await Promise.all([
      countPendingReextraction(),
      countAllReports(),
    ]);
    return json({ pending, total, processed: total - pending });
  } catch (error) {
    console.error("[OpinionBackfill] status failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "status failed" },
      500
    );
  }
}
