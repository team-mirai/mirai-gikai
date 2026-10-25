"use client";

import {
  BILL_VIDEO_KIND_LABELS,
  BILL_VIDEO_KINDS,
  type BillVideoKind,
} from "@mirai-gikai/shared/bill-videos/kinds";
import { parseYouTubeVideoId } from "@mirai-gikai/shared/youtube";
import { Trash2 } from "lucide-react";
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
import {
  EMPTY_BILL_VIDEO_FORM_ITEM,
  toBillVideosFormInput,
} from "../../shared/utils/to-bill-videos-form-input";

interface BillVideosFormProps {
  billId: string;
  videos: BillVideo[];
}

export function BillVideosForm({ billId, videos }: BillVideosFormProps) {
  const [items, setItems] = useState(() => toBillVideosFormInput(videos));
  const [isPending, startTransition] = useTransition();

  const updateItem = (
    kind: BillVideoKind,
    patch: Partial<BillVideoFormItem>
  ) => {
    setItems((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateBillVideos(billId, items);

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
            議案ページの賛否の下に、議論の種類ごとに1本ずつ表示します。URLとタイトルを空にすると表示されません。
          </p>

          {BILL_VIDEO_KINDS.map((kind) => {
            const item = items[kind];
            const isInvalidUrl =
              item.url.trim() !== "" && parseYouTubeVideoId(item.url) === null;

            return (
              <div key={kind} className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {BILL_VIDEO_KIND_LABELS[kind]}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${BILL_VIDEO_KIND_LABELS[kind]}の動画をクリア`}
                    onClick={() => updateItem(kind, EMPTY_BILL_VIDEO_FORM_ITEM)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`video-url-${kind}`}>動画URL</Label>
                  <Input
                    id={`video-url-${kind}`}
                    value={item.url}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => updateItem(kind, { url: e.target.value })}
                    disabled={isPending}
                  />
                  {isInvalidUrl && (
                    <p className="text-sm text-red-600">
                      YouTube の動画URLとして読み取れません
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`video-title-${kind}`}>タイトル</Label>
                  <Input
                    id={`video-title-${kind}`}
                    value={item.title}
                    maxLength={BILL_VIDEO_TITLE_MAX_LENGTH}
                    onChange={(e) =>
                      updateItem(kind, { title: e.target.value })
                    }
                    disabled={isPending}
                  />
                </div>
              </div>
            );
          })}

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
