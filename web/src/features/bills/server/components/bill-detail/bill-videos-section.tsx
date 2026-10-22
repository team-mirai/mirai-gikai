import { BillVideoPlayer } from "../../../client/components/bill-detail/bill-video-player";
import type { BillVideo } from "../../../shared/types";

interface BillVideosSectionProps {
  videos: BillVideo[];
}

/** 議案に紐づくYouTube動画 */
export function BillVideosSection({ videos }: BillVideosSectionProps) {
  return (
    <section>
      <h2 className="text-[22px] font-bold mb-4">📺関連動画</h2>
      {/* 複数並んだときに区切りがわかるよう、動画ごとに白カードを分ける */}
      <div className="flex flex-col gap-4">
        {videos.map((video) => (
          <BillVideoPlayer key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
