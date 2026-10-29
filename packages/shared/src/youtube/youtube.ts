const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** パス形式で動画IDを含むURL（/live/ID, /shorts/ID, /embed/ID） */
const PATH_PREFIXES = ["live", "shorts", "embed"];

/**
 * YouTube の URL（または動画ID そのもの）から動画IDを取り出す。
 * 解釈できなければ null を返す。
 */
export function parseYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  if (VIDEO_ID_PATTERN.test(value)) {
    return value;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  let candidate: string | null | undefined;

  if (url.hostname === "youtu.be") {
    candidate = segments[0];
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (segments[0] === "watch") {
      candidate = url.searchParams.get("v");
    } else if (PATH_PREFIXES.includes(segments[0] ?? "")) {
      candidate = segments[1];
    }
  }

  return candidate && VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

/** 動画IDから YouTube の視聴URLを組み立てる */
export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * 再生用の埋め込みURL。クリック後に読み込むため autoplay を付け、
 * Cookie を使わない youtube-nocookie ドメインを使う。
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

/**
 * サムネイル画像のサイズ。
 * - hq720: 1280x720。HD でアップロードされた動画にしか存在しない
 * - hqdefault: 480x360（上下に黒帯あり）。全動画に存在する
 */
export type YouTubeThumbnailQuality = "hq720" | "hqdefault";

/** 再生前に表示するサムネイル画像のURL */
export function buildYouTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbnailQuality = "hqdefault"
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

const YOUTUBE_PLACEHOLDER_THUMBNAIL_WIDTH = 120;

/**
 * 存在しないサイズのサムネイルを要求すると、YouTube は 404 とともに
 * 120px 幅のグレー画像を返す。ブラウザによっては error にならず表示されるため、
 * 読み込んだ画像の幅で判定する。
 */
export function isYouTubePlaceholderThumbnail(naturalWidth: number): boolean {
  return naturalWidth <= YOUTUBE_PLACEHOLDER_THUMBNAIL_WIDTH;
}
