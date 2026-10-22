"use client";

import { arrayMove } from "@dnd-kit/sortable";
import {
  buildYouTubeWatchUrl,
  parseYouTubeVideoId,
} from "@mirai-gikai/shared/youtube";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBillVideos } from "../../server/actions/update-bill-videos";
import {
  BILL_VIDEO_TITLE_MAX_LENGTH,
  type BillVideo,
  type BillVideoFormItem,
} from "../../shared/types/bill-videos";

interface BillVideosFormProps {
  billId: string;
  videos: BillVideo[];
}

/** 行の並べ替え・削除で入力欄の状態がずれないよう、行ごとに安定したキーを持たせる */
type VideoRow = BillVideoFormItem & { key: string };

/** 追加した行のキー。既存の行は SSR とハイドレーションで一致するよう動画IDを使う */
function createRow(item: BillVideoFormItem): VideoRow {
  return { ...item, key: crypto.randomUUID() };
}

export function BillVideosForm({ billId, videos }: BillVideosFormProps) {
  const [rows, setRows] = useState<VideoRow[]>(() =>
    videos.map((video) => ({
      key: video.id,
      url: buildYouTubeWatchUrl(video.youtube_video_id),
      title: video.title,
    }))
  );
  const [isPending, startTransition] = useTransition();

  const updateRow = (key: string, patch: Partial<BillVideoFormItem>) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  };

  const moveRow = (index: number, offset: -1 | 1) => {
    setRows((prev) => arrayMove(prev, index, index + offset));
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow({ url: "", title: "" })]);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateBillVideos(
        billId,
        rows.map(({ url, title }) => ({ url, title }))
      );

      if (result.success) {
        toast.success("動画を更新しました");
      } else {
        toast.error(result.error || "動画の更新に失敗しました");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube動画</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            党内の議論などの動画を議案ページの賛否の下に表示します。上から順に表示されます。
          </p>

          {rows.map((row, index) => {
            const isInvalidUrl =
              row.url.trim() !== "" && parseYouTubeVideoId(row.url) === null;

            return (
              <div
                key={row.key}
                className="flex gap-3 rounded-md border p-4 items-start"
              >
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`video-url-${row.key}`}>動画URL</Label>
                    <Input
                      id={`video-url-${row.key}`}
                      value={row.url}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) =>
                        updateRow(row.key, { url: e.target.value })
                      }
                      disabled={isPending}
                    />
                    {isInvalidUrl && (
                      <p className="text-sm text-red-600">
                        YouTube の動画URLとして読み取れません
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`video-title-${row.key}`}>タイトル</Label>
                    <Input
                      id={`video-title-${row.key}`}
                      value={row.title}
                      maxLength={BILL_VIDEO_TITLE_MAX_LENGTH}
                      onChange={(e) =>
                        updateRow(row.key, { title: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="上へ移動"
                    onClick={() => moveRow(index, -1)}
                    disabled={isPending || index === 0}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="下へ移動"
                    onClick={() => moveRow(index, 1)}
                    disabled={isPending || index === rows.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="削除"
                    onClick={() => removeRow(row.key)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            disabled={isPending}
          >
            <Plus className="size-4" />
            動画を追加
          </Button>

          <div>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "保存中..." : "動画を保存"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
