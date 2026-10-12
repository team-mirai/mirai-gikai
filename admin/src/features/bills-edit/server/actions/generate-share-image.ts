"use server";

import { z } from "zod";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  listMissingShareImageAssets,
  parseShareImageInput,
} from "../../shared/utils/share-image";
import {
  findBillIdById,
  uploadBillThumbnailFile,
} from "../repositories/bill-edit-repository";
import {
  loadShareImageAssets,
  renderShareImage,
} from "../utils/render-share-image";

const generateShareImageSchema = z.object({
  billId: z.string().uuid({ message: "議案IDが不正です" }),
  title: z.string({ message: "タイトルが不正です" }),
  photoUrl: z.string({ message: "背景写真の URL が不正です" }),
});

export async function generateShareImage(
  params: z.input<typeof generateShareImageSchema>
): Promise<{ url: string } | { error: string }> {
  try {
    await requireAdmin();
    const parsed = generateShareImageSchema.safeParse(params);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "入力が不正です" };
    }
    const { billId, title, photoUrl } = parsed.data;

    if (!(await findBillIdById(billId))) {
      return { error: "議案が見つかりません" };
    }
    const input = parseShareImageInput({
      title,
      photoUrl,
      supabaseUrl: env.supabaseUrl,
      requirePhoto: true,
    });
    if (!input.ok) return { error: input.error };

    const assets = await loadShareImageAssets();
    const missing = listMissingShareImageAssets(assets);
    if (missing.length > 0) {
      console.error(
        `[GenerateShareImage] Missing assets (${missing.join(", ")}), skipped saving`
      );
      return {
        error:
          "フォントまたはロゴを読み込めなかったため保存しませんでした。時間をおいて再度お試しください",
      };
    }

    const image = await renderShareImage({ ...input, assets });
    const url = await uploadBillThumbnailFile({
      fileName: `share_${billId}_${Date.now()}.png`,
      body: await image.arrayBuffer(),
      contentType: "image/png",
    });
    return { url };
  } catch (error) {
    console.error("[GenerateShareImage] Failed:", error);
    return {
      error: getErrorMessage(error, "シェア画像の生成に失敗しました"),
    };
  }
}
