import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_TITLE_FONT_SIZE,
  SHARE_IMAGE_TITLE_LEFT,
  SHARE_IMAGE_TITLE_LETTER_SPACING,
  SHARE_IMAGE_TITLE_LINE_HEIGHT,
  SHARE_IMAGE_TITLE_MAX_WIDTH,
  SHARE_IMAGE_TITLE_OFFSET_Y,
  SHARE_IMAGE_WIDTH,
} from "../../shared/utils/share-image";
import {
  buildShareImageFrameSvg,
  SHARE_IMAGE_FRAME,
  SHARE_IMAGE_LOGO,
  SHARE_IMAGE_TAB,
} from "../../shared/utils/share-image-frame";

const FETCH_TIMEOUT_MS = 5000;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png"];
const OVERLAY_OPACITY = 0.4;
const FALLBACK_BACKGROUND = "#C8C8C8";
const TEXT_COLOR = "#1F2937";
const TITLE_FONT_WEIGHT = 700;
const TAB_FONT_WEIGHT = 700;

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

const fontCache = new Map<number, ArrayBuffer>();

/** Satori は woff2 を読めないので、User-Agent を送らずに TTF を取得する */
async function loadFont(weight: number): Promise<ArrayBuffer> {
  const cached = fontCache.get(weight);
  if (cached) return cached;
  const cssRes = await fetchWithTimeout(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&display=swap`
  );
  if (!cssRes.ok) throw new Error("フォントの取得に失敗しました");
  const fontUrl = (await cssRes.text())
    .match(/src:\s*url\(([^)]+)\)\s*format\('(opentype|truetype)'\)/)?.[1]
    ?.replace(/^["']|["']$/g, "");
  if (!fontUrl) throw new Error("フォントの取得に失敗しました");
  const fontRes = await fetchWithTimeout(fontUrl);
  if (!fontRes.ok) throw new Error("フォントの取得に失敗しました");
  const data = await fontRes.arrayBuffer();
  fontCache.set(weight, data);
  return data;
}

let cachedLogoDataUrl: string | null = null;

async function loadLogo(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const buf = await readFile(join(process.cwd(), "public/img/ogp-logo.png"));
  cachedLogoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  return cachedLogoDataUrl;
}

const frameDataUrl = `data:image/svg+xml;base64,${Buffer.from(
  buildShareImageFrameSvg()
).toString("base64")}`;

/** photoUrl は呼び出し側で isAllowedSharePhotoUrl を通したものに限る */
async function loadPhoto(photoUrl: string): Promise<string> {
  const res = await fetchWithTimeout(photoUrl);
  if (!res.ok) throw new Error("背景写真の取得に失敗しました");
  const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
  if (!PHOTO_CONTENT_TYPES.includes(contentType)) {
    throw new Error("背景写真は JPEG か PNG にしてください");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > PHOTO_MAX_BYTES) {
    throw new Error("背景写真は5MB以下にしてください");
  }
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

export async function renderShareImage(params: {
  lines: string[];
  photoUrl?: string | null;
}): Promise<ImageResponse> {
  const [titleFont, tabFont, logo, photo] = await Promise.all([
    loadFont(TITLE_FONT_WEIGHT),
    loadFont(TAB_FONT_WEIGHT),
    loadLogo(),
    params.photoUrl ? loadPhoto(params.photoUrl) : Promise.resolve(null),
  ]);

  const frame = SHARE_IMAGE_FRAME;
  const tab = SHARE_IMAGE_TAB;
  const logoBox = SHARE_IMAGE_LOGO;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: FALLBACK_BACKGROUND,
        fontFamily: "Noto Sans JP",
      }}
    >
      {photo && (
        // biome-ignore lint/performance/noImgElement: Satori は img のみ対応
        <img
          alt=""
          src={photo}
          width={SHARE_IMAGE_WIDTH}
          height={SHARE_IMAGE_HEIGHT}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
      )}
      {photo && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: SHARE_IMAGE_WIDTH,
            height: SHARE_IMAGE_HEIGHT,
            backgroundColor: `rgba(0, 0, 0, ${OVERLAY_OPACITY})`,
          }}
        />
      )}
      {/* biome-ignore lint/performance/noImgElement: Satori は img のみ対応 */}
      <img
        alt=""
        src={frameDataUrl}
        width={SHARE_IMAGE_WIDTH}
        height={SHARE_IMAGE_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          top: frame.top,
          left: tab.left,
          width: frame.right - tab.left,
          height: tab.bottom - frame.top,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: 6,
          paddingBottom: 4,
          fontSize: 46,
          fontWeight: TAB_FONT_WEIGHT,
          color: TEXT_COLOR,
          letterSpacing: "0.08em",
        }}
      >
        みらい議会
      </div>
      <div
        style={{
          position: "absolute",
          top: SHARE_IMAGE_TITLE_OFFSET_Y,
          left: SHARE_IMAGE_TITLE_LEFT,
          width: SHARE_IMAGE_TITLE_MAX_WIDTH,
          height: SHARE_IMAGE_HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: "white",
          fontSize: SHARE_IMAGE_TITLE_FONT_SIZE,
          fontWeight: TITLE_FONT_WEIGHT,
          lineHeight: `${SHARE_IMAGE_TITLE_LINE_HEIGHT}px`,
          letterSpacing: SHARE_IMAGE_TITLE_LETTER_SPACING,
        }}
      >
        {params.lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 行の並びは固定
          <div key={index} style={{ display: "flex" }}>
            {line}
          </div>
        ))}
      </div>
      {/* biome-ignore lint/performance/noImgElement: Satori は img のみ対応 */}
      <img
        alt="チームみらいロゴ"
        src={logo}
        width={logoBox.width}
        height={logoBox.height}
        style={{ position: "absolute", top: logoBox.top, left: logoBox.left }}
      />
    </div>,
    {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      fonts: [
        {
          name: "Noto Sans JP",
          data: titleFont,
          style: "normal",
          weight: TITLE_FONT_WEIGHT,
        },
        {
          name: "Noto Sans JP",
          data: tabFont,
          style: "normal",
          weight: TAB_FONT_WEIGHT,
        },
      ],
    }
  );
}
