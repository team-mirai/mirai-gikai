import { parseYouTubeVideoId } from "@mirai-gikai/shared/youtube";
import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

/** DB の check 制約（char_length(title) between 1 and 200）と揃える */
export const BILL_VIDEO_TITLE_MAX_LENGTH = 200;

export type BillVideo = Database["public"]["Tables"]["bill_videos"]["Row"];

/** フォーム入力を検証し、DB に保存する形（動画ID・タイトル）へ変換する */
const billVideoInputSchema = z
  .object({
    url: z.string(),
    title: z
      .string()
      .trim()
      .min(1, "タイトルは必須です")
      .max(
        BILL_VIDEO_TITLE_MAX_LENGTH,
        `タイトルは${BILL_VIDEO_TITLE_MAX_LENGTH}文字以内で入力してください`
      ),
  })
  .transform(({ url, title }, ctx) => {
    const videoId = parseYouTubeVideoId(url);
    if (videoId === null) {
      ctx.addIssue({
        code: "custom",
        message: "YouTube の動画URLを入力してください",
        path: ["url"],
      });
      return z.NEVER;
    }
    return { youtube_video_id: videoId, title };
  });

export const billVideosInputSchema = z.array(billVideoInputSchema);

/** 編集フォームで扱う動画1件分の入力 */
export type BillVideoFormItem = z.input<typeof billVideoInputSchema>;

/** DB に保存する動画1件分（表示順は配列順） */
export type BillVideoInput = z.output<typeof billVideoInputSchema>;
