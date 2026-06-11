import { resolveBackfillParams } from "@mirai-gikai/topic-analysis-core/backfill-params";
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

/** 進捗（未処理件数 / 全件数）を返す。UI のポーリング用。billId で議案に絞れる。 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  // billId の UUID 検証だけ resolveBackfillParams に委譲する（scope は status では未使用）。
  const billIdParam = new URL(request.url).searchParams.get("billId");
  const resolved = resolveBackfillParams({ billId: billIdParam });
  if (!resolved.ok) {
    return json({ error: resolved.error }, 400);
  }
  const { billId } = resolved.params;

  try {
    const [pending, total] = await Promise.all([
      countPendingReextraction(billId),
      countAllReports(billId),
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
