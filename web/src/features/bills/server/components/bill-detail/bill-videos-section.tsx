import { BillVideoPlayer } from "../../../client/components/bill-detail/bill-video-player";
import type { BillVideo } from "../../../shared/types";

interface BillVideosSectionProps {
  videos: BillVideo[];
}

/** 議案に紐づく党内の議論などのYouTube動画 */
export function BillVideosSection({ videos }: BillVideosSectionProps) {
  return (
    <section>
      <h2 className="text-[22px] font-bold mb-4">📺チームみらいの党内議論</h2>
      {/* 記事本文の各セクションと同じ白カードに収める */}
      <div className="flex flex-col divide-y divide-mirai-border rounded-md bg-white px-4 py-2 [&>*]:py-6">
        {videos.map((video) => (
          <BillVideoPlayer key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
