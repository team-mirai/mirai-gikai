"use client";

import {
  buildYouTubeEmbedUrl,
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  isYouTubePlaceholderThumbnail,
  type YouTubeThumbnailQuality,
} from "@mirai-gikai/shared/youtube";
import { ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BillVideo } from "../../../shared/types";

/**
 * 初期表示はサムネイルのみとし、クリックされたら YouTube プレイヤーを読み込む。
 * ページ表示時に YouTube のスクリプトや Cookie を読み込まないようにするため。
 */
export function BillVideoPlayer({ video }: { video: BillVideo }) {
  const [isPlaying, setIsPlaying] = useState(false);
  // 高解像度の hq720 を優先し、存在しない動画では全動画にある hqdefault に切り替える
  const [thumbnailQuality, setThumbnailQuality] =
    useState<YouTubeThumbnailQuality>("hq720");
  const fallbackToDefaultThumbnail = () => setThumbnailQuality("hqdefault");

  return (
    // 記事本文の各セクションと同じ白カード。動画はカード上部いっぱいに表示する
    <div className="flex flex-col overflow-hidden rounded-md bg-white">
      <div className="relative aspect-video w-full bg-black">
        {isPlaying ? (
          <iframe
            src={buildYouTubeEmbedUrl(video.youtube_video_id)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsPlaying(true)}
            aria-label={`動画を再生: ${video.title}`}
            className="group absolute inset-0 size-full rounded-none p-0 hover:bg-transparent"
          >
            <Image
              src={buildYouTubeThumbnailUrl(
                video.youtube_video_id,
                thumbnailQuality
              )}
              alt=""
              onError={fallbackToDefaultThumbnail}
              onLoad={(e) => {
                if (
                  isYouTubePlaceholderThumbnail(e.currentTarget.naturalWidth)
                ) {
                  fallbackToDefaultThumbnail();
                }
              }}
              fill
              unoptimized
              className="object-cover"
            />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-white text-mirai-brand-teal-ink shadow-lg transition-transform group-hover:scale-110">
              <Play className="size-8 translate-x-0.5 fill-current" />
            </span>
          </Button>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-5">
        <p className="font-bold leading-relaxed text-mirai-text">
          {video.title}
        </p>
        {/* アプリ内ブラウザなどから YouTube アプリで開きたい人向け */}
        <a
          href={buildYouTubeWatchUrl(video.youtube_video_id)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`YouTubeで開く: ${video.title}`}
          className="mt-0.5 shrink-0 text-mirai-text-subtle hover:opacity-80"
        >
          <ExternalLink className="size-5" />
        </a>
      </div>
    </div>
  );
}
