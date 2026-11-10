import "server-only";

import { getStanceByBillId } from "@/features/mirai-stance/server/loaders/get-stance-by-bill-id";
import {
  parseBreakingNewsImageInput,
  toBreakingNewsStance,
} from "../../shared/utils/breaking-news-image";
import { getBillById } from "../loaders/get-bill-by-id";
import {
  loadBreakingNewsImageAssets,
  renderBreakingNewsImage,
} from "../utils/render-breaking-news-image";

export type RenderBillBreakingNewsImageParams = {
  billId: string;
  result: string | null;
  reachedStep: string | null;
  /** YYYY-MM-DD。null なら画像に日付を入れない */
  date: string | null;
  place: string | null;
  title: string | null;
  includeStance: boolean;
};

export type RenderBillBreakingNewsImageErrorReason =
  | "invalid_input"
  | "bill_not_found"
  | "assets_unavailable";

export type RenderBillBreakingNewsImageResult =
  | { ok: true; png: ArrayBuffer }
  | {
      ok: false;
      reason: RenderBillBreakingNewsImageErrorReason;
      message: string;
    };

/**
 * 法案の速報画像（PNG）を作る。admin 画面の画像 API と MCP の両方から呼ぶ。
 * 描画そのものに失敗した場合は例外を投げる
 */
export async function renderBillBreakingNewsImage(
  params: RenderBillBreakingNewsImageParams
): Promise<RenderBillBreakingNewsImageResult> {
  const bill = await getBillById(params.billId);
  if (!bill) {
    return { ok: false, reason: "bill_not_found", message: "Bill not found" };
  }

  // 賛否は呼び出し側から受け取らず DB の公開中の値だけを使う(未公開の賛否を画像に出さないため)
  const publishedStance = params.includeStance
    ? toBreakingNewsStance(await getStanceByBillId(bill.id), new Date())
    : null;

  const input = parseBreakingNewsImageInput({
    originatingHouse: bill.originating_house,
    proposalType: bill.proposal_type,
    result: params.result,
    reachedStep: params.reachedStep,
    date: params.date,
    place: params.place,
    title: params.title,
    includeStance: params.includeStance,
    publishedStance,
  });
  if (!input.ok) {
    return { ok: false, reason: "invalid_input", message: input.error };
  }

  const { bold, black, logo } = await loadBreakingNewsImageAssets();
  if (!bold || !black || !logo) {
    return {
      ok: false,
      reason: "assets_unavailable",
      message:
        "フォントまたはロゴを読み込めませんでした。時間をおいて再度お試しください",
    };
  }

  const image = await renderBreakingNewsImage({
    input,
    assets: { bold, black, logo },
  });
  return { ok: true, png: await image.arrayBuffer() };
}
