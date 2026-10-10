"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { parseShareImageInput } from "../../shared/utils/share-image";
import {
  findBillById,
  uploadBillThumbnailFile,
} from "../repositories/bill-edit-repository";
import { renderShareImage } from "../utils/render-share-image";

export async function generateShareImage(params: {
  billId: string;
  title: string;
  photoUrl: string;
}): Promise<{ url: string } | { error: string }> {
  try {
    await requireAdmin();
    if (!z.string().uuid().safeParse(params.billId).success) {
      return { error: "議案IDが不正です" };
    }
    const bill = await findBillById(params.billId).catch(() => null);
    if (!bill) return { error: "議案が見つかりません" };
    const input = parseShareImageInput({
      title: params.title,
      photoUrl: params.photoUrl,
      supabaseUrl: env.supabaseUrl,
      requirePhoto: true,
    });
    if (!input.ok) return { error: input.error };

    const image = await renderShareImage(input);
    const url = await uploadBillThumbnailFile({
      fileName: `share_${params.billId}_${Date.now()}.png`,
      body: await image.arrayBuffer(),
      contentType: "image/png",
    });
    return { url };
  } catch (error) {
    console.error("Generate share image error:", error);
    return {
      error: getErrorMessage(error, "シェア画像の生成に失敗しました"),
    };
  }
}
