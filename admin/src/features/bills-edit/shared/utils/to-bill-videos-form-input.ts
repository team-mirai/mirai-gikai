import type { BillVideoKind } from "@mirai-gikai/shared/bill-videos/kinds";
import { buildYouTubeWatchUrl } from "@mirai-gikai/shared/youtube";
import type {
  BillVideo,
  BillVideoFormItem,
  BillVideosFormInput,
} from "../types/bill-videos";

export const EMPTY_BILL_VIDEO_FORM_ITEM: BillVideoFormItem = {
  url: "",
  title: "",
};

/**
 * 登録済みの動画を、議論の種類ごとの編集フォームの初期値に変換する
 */
export function toBillVideosFormInput(
  videos: Pick<BillVideo, "kind" | "youtube_video_id" | "title">[]
): BillVideosFormInput {
  const findItem = (kind: BillVideoKind): BillVideoFormItem => {
    const video = videos.find((v) => v.kind === kind);
    return video
      ? {
          url: buildYouTubeWatchUrl(video.youtube_video_id),
          title: video.title,
        }
      : EMPTY_BILL_VIDEO_FORM_ITEM;
  };

  return {
    stance_decision: findItem("stance_decision"),
    caucus: findItem("caucus"),
  };
}
