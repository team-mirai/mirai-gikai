import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

export type SupplementaryResolution =
  Database["public"]["Tables"]["bill_supplementary_resolutions"]["Row"];
export type SupplementaryResolutionStance =
  Database["public"]["Enums"]["supplementary_resolution_stance"];

export const supplementaryResolutionInputSchema = z.object({
  // 附帯決議の内容を確認できる参考リンク
  referenceUrl: z
    .string()
    .trim()
    .regex(/^https?:\/\/\S+$/, "有効なURLを入力してください"),
  stance: z.enum(["for", "against"] as const),
  // 附帯決議で重視した事項・理由（任意）。空文字・null・省略はいずれも未設定として保存する
  focusPoints: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});

export type SupplementaryResolutionInput = z.infer<
  typeof supplementaryResolutionInputSchema
>;

export const SUPPLEMENTARY_RESOLUTION_STANCE_LABELS: Record<
  SupplementaryResolutionStance,
  string
> = {
  for: "賛成",
  against: "反対",
};
