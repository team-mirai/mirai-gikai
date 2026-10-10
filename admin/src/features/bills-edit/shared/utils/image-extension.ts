const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** 保存先のファイル名に使う拡張子。MIME を優先し、ファイル名由来のものは英数字だけ許す */
export function getImageExtension(mimeType: string, fileName: string): string {
  const fromMime = EXTENSION_BY_MIME[mimeType];
  if (fromMime) return fromMime;
  const fromName = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase()
    : undefined;
  return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : "img";
}
