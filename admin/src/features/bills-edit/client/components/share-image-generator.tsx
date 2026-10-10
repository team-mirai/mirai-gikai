"use client";

import { ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateShareImage } from "../../server/actions/generate-share-image";
import {
  buildShareImagePreviewPath,
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_TITLE_MAX_LENGTH,
  SHARE_IMAGE_TITLE_MAX_LINES,
  SHARE_IMAGE_WIDTH,
  validateShareImageTitle,
} from "../../shared/utils/share-image";
import { uploadThumbnail } from "../lib/thumbnail-storage";

const PREVIEW_DEBOUNCE_MS = 600;

interface ShareImageGeneratorProps {
  billId: string;
  defaultTitle: string;
  onGenerated: (url: string) => void;
}

export function ShareImageGenerator({
  billId,
  defaultTitle,
  onGenerated,
}: ShareImageGeneratorProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validation = validateShareImageTitle(title);

  useEffect(() => {
    if (!validateShareImageTitle(title).ok) return;
    const timer = setTimeout(
      () => setPreviewPath(buildShareImagePreviewPath({ title, photoUrl })),
      PREVIEW_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [title, photoUrl]);

  const handlePhotoAccepted = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setIsUploading(true);
    setMessage(null);
    const result = await uploadThumbnail(file, billId, "share-src");
    setIsUploading(false);
    if (result.error || !result.url) {
      setMessage(result.error ?? "アップロードに失敗しました");
      return;
    }
    setPhotoUrl(result.url);
  };

  const handleGenerate = async () => {
    if (!photoUrl) return;
    setIsGenerating(true);
    setMessage(null);
    const result = await generateShareImage({ billId, title, photoUrl });
    setIsGenerating(false);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }
    onGenerated(result.url);
    setMessage(
      "シェア画像に設定しました。保存ボタンを押すと議案に反映されます。"
    );
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <p className="text-sm font-medium">テンプレートからシェア画像を生成</p>

      <div className="space-y-2">
        <Label>背景写真（JPEG / PNG）</Label>
        <Dropzone
          onFilesAccepted={handlePhotoAccepted}
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
          disabled={isUploading}
        />
        {isUploading && (
          <p className="text-sm text-blue-600">アップロード中...</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="share-image-title">タイトル</Label>
        <Textarea
          id="share-image-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          改行した位置で折り返します。{SHARE_IMAGE_TITLE_MAX_LINES}
          行・改行を除いて{SHARE_IMAGE_TITLE_MAX_LENGTH}文字まで。
        </p>
        {!validation.ok && (
          <p className="text-sm text-destructive">{validation.error}</p>
        )}
      </div>

      {previewPath && (
        <div className="space-y-2">
          <Label>プレビュー{photoUrl ? "" : "（背景写真なし）"}</Label>
          <Image
            src={previewPath}
            alt="シェア画像のプレビュー"
            width={SHARE_IMAGE_WIDTH}
            height={SHARE_IMAGE_HEIGHT}
            unoptimized
            className="w-full max-w-xl rounded-lg border"
          />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleGenerate}
        disabled={!photoUrl || !validation.ok || isGenerating || isUploading}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4 mr-2" />
        )}
        この画像をシェア画像に設定
      </Button>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
