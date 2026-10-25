import { BILL_VIDEO_KINDS } from "@mirai-gikai/shared/bill-videos/kinds";
import { parseYouTubeVideoId } from "@mirai-gikai/shared/youtube";
import type { Database } from "@mirai-gikai/supabase";
import { z } from "zod";

/** DB の check 制約（char_length(title) between 1 and 200）と揃える */
export const BILL_VIDEO_TITLE_MAX_LENGTH = 200;

export type BillVideo = Database["public"]["Tables"]["bill_videos"]["Row"];

/**
 * フォーム入力を検証し、DB に保存する形（動画ID・タイトル）へ変換する。
 * URL・タイトルともに空なら、その種類の動画は登録しない（null）。
 */
const billVideoInputSchema = z
  .object({
    url: z.string().trim(),
    title: z.string().trim(),
  })
  .transform(({ url, title }, ctx) => {
    if (url === "" && title === "") {
      return null;
    }

    const videoId = parseYouTubeVideoId(url);
    const titleError =
      title === ""
        ? "タイトルは必須です"
        : title.length > BILL_VIDEO_TITLE_MAX_LENGTH
          ? `タイトルは${BILL_VIDEO_TITLE_MAX_LENGTH}文字以内で入力してください`
          : null;

    if (videoId === null) {
      ctx.addIssue({
        code: "custom",
        message: "YouTube の動画URLを入力してください",
        path: ["url"],
      });
    }
    if (titleError !== null) {
      ctx.addIssue({ code: "custom", message: titleError, path: ["title"] });
    }
    if (videoId === null || titleError !== null) {
      return z.NEVER;
    }
    return { youtube_video_id: videoId, title };
  });

/** 議論の種類ごとに1本ずつ */
export const billVideosInputSchema = z.record(
  z.enum(BILL_VIDEO_KINDS),
  billVideoInputSchema
);

/** 編集フォームで扱う動画1件分の入力 */
export type BillVideoFormItem = z.input<typeof billVideoInputSchema>;

/** 編集フォームで扱う全種類の入力 */
export type BillVideosFormInput = z.input<typeof billVideosInputSchema>;

/** DB に保存する形（null の種類は削除する） */
export type BillVideosInput = z.output<typeof billVideosInputSchema>;
