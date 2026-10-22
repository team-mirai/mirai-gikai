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
      {/* 記事本文の各セクションと同じ白カード。動画はカードの端まで表示する */}
      <div className="flex flex-col divide-y divide-mirai-border overflow-hidden rounded-md bg-white">
        {videos.map((video) => (
          <BillVideoPlayer key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
