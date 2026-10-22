"use client";

import {
  buildYouTubeEmbedUrl,
  buildYouTubeThumbnailUrl,
} from "@mirai-gikai/shared/youtube";
import { Play } from "lucide-react";
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

  return (
    <div className="flex flex-col">
      {/* 角丸はカード側に持たせ、動画はカード上部いっぱいに表示する */}
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
              src={buildYouTubeThumbnailUrl(video.youtube_video_id)}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
            <span className="relative flex size-16 items-center justify-center rounded-full border border-black bg-mirai-gradient text-black shadow-md transition-transform group-hover:scale-110">
              <Play className="size-7 translate-x-0.5 fill-current" />
            </span>
          </Button>
        )}
      </div>
      <div className="px-4 pt-4 pb-5">
        <p className="font-bold leading-relaxed text-mirai-text">
          {video.title}
        </p>
      </div>
    </div>
  );
}
