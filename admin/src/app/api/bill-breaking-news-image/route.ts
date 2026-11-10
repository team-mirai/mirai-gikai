import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  type RenderBillBreakingNewsImageErrorReason,
  renderBillBreakingNewsImage,
} from "@/features/bills-edit/server/services/render-bill-breaking-news-image";

const ERROR_STATUS: Record<RenderBillBreakingNewsImageErrorReason, number> = {
  invalid_input: 400,
  bill_not_found: 404,
  assets_unavailable: 503,
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("billId");
  if (!billId) {
    return new Response("Bill not found", { status: 404 });
  }

  try {
    const result = await renderBillBreakingNewsImage({
      billId,
      result: searchParams.get("result"),
      reachedStep: searchParams.get("reachedStep"),
      date: searchParams.get("date"),
      place: searchParams.get("place"),
      title: searchParams.get("title"),
      includeStance: searchParams.get("stance") === "1",
    });
    if (!result.ok) {
      return new Response(result.message, {
        status: ERROR_STATUS[result.reason],
      });
    }
    return new Response(result.png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[BillBreakingNewsImage] Render failed:", error);
    return new Response("Failed to render image", { status: 500 });
  }
}
