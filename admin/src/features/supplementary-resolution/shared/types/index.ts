import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

export type SupplementaryResolution =
  Database["public"]["Tables"]["bill_supplementary_resolutions"]["Row"];
export type SupplementaryResolutionStance =
  Database["public"]["Enums"]["supplementary_resolution_stance"];
export type SupplementaryResolutionHouse =
  Database["public"]["Enums"]["house_enum"];

// 附帯決議は衆議院・参議院それぞれで1件ずつ記録する。並びは表示順
export const SUPPLEMENTARY_RESOLUTION_HOUSES = [
  "HR",
  "HC",
] as const satisfies readonly SupplementaryResolutionHouse[];

export const supplementaryResolutionHouseSchema = z.enum(
  SUPPLEMENTARY_RESOLUTION_HOUSES
);

export const supplementaryResolutionInputSchema = z.object({
  // 附帯決議を付した院。議案ごと・院ごとに1件
  house: supplementaryResolutionHouseSchema,
  // 附帯決議の内容を確認できる参考リンク（任意）。空文字・null・省略は未設定として保存し、
  // 入れる場合は http(s) の URL に限る
  referenceUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/.test(value),
      "有効なURLを入力してください"
    )
    .nullable()
    .optional(),
  // 附帯決議の内容（自由記述・任意）。空文字・null・省略はいずれも未設定として保存する
  content: z.string().nullable().optional(),
  stance: z.enum(["for", "against"] as const),
  // 附帯決議で重視した事項・理由（任意）。空文字・null・省略はいずれも未設定として保存する
  focusPoints: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  // 公開するか。省略時は、新規なら非公開（DB の既定）、既存なら今の公開/非公開を変えない
  isPublished: z.boolean().optional(),
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
