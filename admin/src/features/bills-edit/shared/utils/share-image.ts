export const SHARE_IMAGE_WIDTH = 1800;
export const SHARE_IMAGE_HEIGHT = 945;

export const SHARE_IMAGE_TITLE_MAX_LENGTH = 60;
export const SHARE_IMAGE_TITLE_MAX_LINES = 3;
export const SHARE_IMAGE_TITLE_FONT_SIZE = 105;
export const SHARE_IMAGE_TITLE_LINE_HEIGHT = 150;
export const SHARE_IMAGE_TITLE_LETTER_SPACING_EM = 0.03;
export const SHARE_IMAGE_TITLE_LEFT = 136;
export const SHARE_IMAGE_TITLE_OFFSET_Y = -7;
export const SHARE_IMAGE_TITLE_MAX_WIDTH = 1560;

export const BILL_THUMBNAILS_BUCKET = "bill-thumbnails";

const HALF_WIDTH_RATIO = 0.65;

export function splitShareImageTitle(title: string): string[] {
  return title
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** 全角1・半角0.65に字間を足して、フォントサイズ何文字分の幅になるかを安全側に見積もる */
export function estimateLineWidthInEm(line: string): number {
  let width = 0;
  for (const char of line) {
    const glyph = /[\u0020-\u007e\uff61-\uff9f]/.test(char)
      ? HALF_WIDTH_RATIO
      : 1;
    width += glyph + SHARE_IMAGE_TITLE_LETTER_SPACING_EM;
  }
  return width;
}

export type ShareImageTitleValidation =
  | { ok: true; lines: string[] }
  | { ok: false; error: string };

export function validateShareImageTitle(
  title: string
): ShareImageTitleValidation {
  const lines = splitShareImageTitle(title);
  if (lines.length === 0) {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (lines.length > SHARE_IMAGE_TITLE_MAX_LINES) {
    return {
      ok: false,
      error: `タイトルは${SHARE_IMAGE_TITLE_MAX_LINES}行以内にしてください`,
    };
  }
  const length = lines.reduce((sum, line) => sum + [...line].length, 0);
  if (length > SHARE_IMAGE_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `タイトルは改行を除いて${SHARE_IMAGE_TITLE_MAX_LENGTH}文字以内にしてください`,
    };
  }
  const maxEm = SHARE_IMAGE_TITLE_MAX_WIDTH / SHARE_IMAGE_TITLE_FONT_SIZE;
  const overflowIndex = lines.findIndex(
    (line) => estimateLineWidthInEm(line) > maxEm
  );
  if (overflowIndex !== -1) {
    return {
      ok: false,
      error: `${overflowIndex + 1}行目が長すぎて画像に収まりません。改行を入れてください`,
    };
  }
  return { ok: true, lines };
}

/** SSRF 対策として、自前の Supabase Storage の bill-thumbnails 公開 URL だけを許可する */
export function isAllowedSharePhotoUrl(
  photoUrl: string,
  supabaseUrl: string
): boolean {
  let photo: URL;
  let supabase: URL;
  try {
    photo = new URL(photoUrl);
    supabase = new URL(supabaseUrl);
  } catch {
    return false;
  }
  if (photo.origin !== supabase.origin) return false;
  if (photo.username || photo.password) return false;
  const prefix = `/storage/v1/object/public/${BILL_THUMBNAILS_BUCKET}/`;
  if (!photo.pathname.startsWith(prefix)) return false;
  const fileName = photo.pathname.slice(prefix.length);
  return /^[A-Za-z0-9._-]+$/.test(fileName) && !fileName.includes("..");
}

export function buildShareImagePreviewPath(params: {
  title: string;
  photoUrl?: string | null;
}): string {
  const search = new URLSearchParams({ title: params.title });
  if (params.photoUrl) search.set("photoUrl", params.photoUrl);
  return `/api/bill-share-image?${search.toString()}`;
}

export type ShareImageInput =
  | { ok: true; lines: string[]; photoUrl: string | null }
  | { ok: false; error: string };

export function parseShareImageInput(params: {
  title: string | null;
  photoUrl: string | null;
  supabaseUrl: string;
  requirePhoto: boolean;
}): ShareImageInput {
  const titleResult = validateShareImageTitle(params.title ?? "");
  if (!titleResult.ok) return titleResult;
  if (!params.photoUrl) {
    return params.requirePhoto
      ? { ok: false, error: "背景写真をアップロードしてください" }
      : { ok: true, lines: titleResult.lines, photoUrl: null };
  }
  if (!isAllowedSharePhotoUrl(params.photoUrl, params.supabaseUrl)) {
    return { ok: false, error: "背景写真の URL が不正です" };
  }
  return { ok: true, lines: titleResult.lines, photoUrl: params.photoUrl };
}
