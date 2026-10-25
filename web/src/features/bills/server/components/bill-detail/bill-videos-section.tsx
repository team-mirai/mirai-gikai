import {
  BILL_VIDEO_KIND_LABELS,
  BILL_VIDEO_KINDS,
} from "@mirai-gikai/shared/bill-videos/kinds";
import { BillVideoPlayer } from "../../../client/components/bill-detail/bill-video-player";
import type { BillVideo } from "../../../shared/types";

interface BillVideosSectionProps {
  videos: BillVideo[];
}

/** 議案に紐づくYouTube動画。議論の種類ごとに見出しを分けて表示する */
export function BillVideosSection({ videos }: BillVideosSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      {BILL_VIDEO_KINDS.map((kind) => {
        const video = videos.find((v) => v.kind === kind);
        if (!video) {
          return null;
        }

        return (
          <section key={kind}>
            <h2 className="text-[22px] font-bold mb-4">
              📺{BILL_VIDEO_KIND_LABELS[kind]}
            </h2>
            <BillVideoPlayer video={video} />
          </section>
        );
      })}
    </div>
  );
}
