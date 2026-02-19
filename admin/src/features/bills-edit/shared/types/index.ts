import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

// 既存の型を再利用
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];

// 公開ステータス型
export type BillPublishStatus = "draft" | "published" | "coming_soon";

// 共通のバリデーションスキーマ
const billBaseSchema = z.object({
  name: z
    .string()
    .min(1, "議案名は必須です")
    .max(200, "議案名は200文字以内で入力してください"),
  status: z.enum([
    "preparing",
    "introduced",
    "in_originating_house",
    "in_receiving_house",
    "enacted",
    "rejected",
  ]),
  originating_house: z.enum(["HR", "HC"]),
  status_note: z
    .string()
    .max(500, "ステータス備考は500文字以内で入力してください")
    .nullable(),
  published_at: z.string().optional(),
  thumbnail_url: z.string().nullable().optional(),
  share_thumbnail_url: z.string().nullable().optional(),
  shugiin_url: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine((val) => val === null || val.startsWith("http"), {
      message: "有効なURLを入力してください",
    })
    .optional(),
  is_featured: z.boolean(),
  diet_session_id: z.string().uuid().nullable().optional(),
});

// 更新用スキーマ（既存）
export const billUpdateSchema = billBaseSchema;
export type BillUpdateInput = z.infer<typeof billUpdateSchema>;

// 新規作成用スキーマ
export const billCreateSchema = billBaseSchema;
export type BillCreateInput = z.infer<typeof billCreateSchema>;
