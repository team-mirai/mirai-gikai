import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import {
  loadBreakingNewsImageAssets,
  renderBreakingNewsImage,
} from "@/features/bills-edit/server/utils/render-breaking-news-image";
import {
  parseBreakingNewsImageInput,
  toBreakingNewsStance,
} from "@/features/bills-edit/shared/utils/breaking-news-image";
import { getStanceByBillId } from "@/features/mirai-stance/server/loaders/get-stance-by-bill-id";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("billId");
  const bill = billId ? await getBillById(billId) : null;
  if (!bill) {
    return new Response("Bill not found", { status: 404 });
  }

  // 賛否は画面から渡さず DB の公開中の値だけを使う(未公開の賛否を画像に出さないため)
  const includeStance = searchParams.get("stance") === "1";
  const publishedStance = includeStance
    ? toBreakingNewsStance(await getStanceByBillId(bill.id), new Date())
    : null;

  const input = parseBreakingNewsImageInput({
    originatingHouse: bill.originating_house,
    proposalType: bill.proposal_type,
    result: searchParams.get("result"),
    reachedStep: searchParams.get("reachedStep"),
    date: searchParams.get("date"),
    place: searchParams.get("place"),
    title: searchParams.get("title"),
    includeStance,
    publishedStance,
  });
  if (!input.ok) {
    return new Response(input.error, { status: 400 });
  }

  const { bold, black, logo } = await loadBreakingNewsImageAssets();
  if (!bold || !black || !logo) {
    return new Response(
      "フォントまたはロゴを読み込めませんでした。時間をおいて再度お試しください",
      { status: 503 }
    );
  }

  try {
    const image = await renderBreakingNewsImage({
      input,
      assets: { bold, black, logo },
    });
    return new Response(await image.arrayBuffer(), {
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
