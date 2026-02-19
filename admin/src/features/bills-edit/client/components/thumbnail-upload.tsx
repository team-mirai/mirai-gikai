"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { deleteThumbnail, uploadThumbnail } from "../lib/thumbnail-storage";

interface ThumbnailUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  billId?: string;
  storagePrefix?: string;
}

export function ThumbnailUpload({
  value,
  onChange,
  billId,
  storagePrefix,
}: ThumbnailUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesAccepted = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 既存のファイルがある場合は削除
      if (value) {
        await deleteThumbnail(value);
      }

      // 新しいファイルをアップロード
      const result = await uploadThumbnail(file, billId, storagePrefix);

      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.url) {
        onChange(result.url);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      try {
        const result = await deleteThumbnail(value);
        if (!result.success && result.error) {
          console.error("Remove error:", result.error);
        }
      } catch (error) {
        console.error("Remove error:", error);
      }
    }
    onChange(null);
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full max-w-sm h-48">
          <Image
            src={value}
            alt="サムネイル"
            fill
            className="object-cover rounded-lg border"
            sizes="(max-width: 384px) 100vw, 384px"
          />
        </div>
      ) : (
        <Dropzone
          onFilesAccepted={handleFilesAccepted}
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          accept={{
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
          }}
          disabled={isUploading}
        />
      )}

      {value && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleRemove}>
            <X className="h-4 w-4 mr-2" />
            削除
          </Button>
        </div>
      )}

      {isUploading && (
        <p className="text-sm text-blue-600">アップロード中...</p>
      )}
    </div>
  );
}
