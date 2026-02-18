"use client";

import { FileText, Upload, X } from "lucide-react";
import type { HTMLAttributes } from "react";
import { useState } from "react";

import type { DropzoneOptions } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DropzoneProps extends HTMLAttributes<HTMLDivElement> {
  onFilesAccepted?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: DropzoneOptions["accept"];
  disabled?: boolean;
}

export function Dropzone({
  onFilesAccepted,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  },
  disabled = false,
  className,
  ...props
}: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        setFiles(acceptedFiles);
        onFilesAccepted?.(acceptedFiles);
      },
      accept,
      maxFiles,
      maxSize,
      disabled,
    });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesAccepted?.(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragActive && !disabled && "hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-sm text-muted-foreground">
            ファイルをドロップしてください
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              ファイルをドラッグ&ドロップまたはクリックして選択
            </p>
            <p className="text-xs text-muted-foreground">
              最大{maxFiles}ファイル、各{(maxSize / 1024 / 1024).toFixed(0)}
              MBまで
            </p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm font-medium text-red-900">{file.name}</p>
              <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                {errors.map((error) => (
                  <li key={error.code}>{error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(files.indexOf(file))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
