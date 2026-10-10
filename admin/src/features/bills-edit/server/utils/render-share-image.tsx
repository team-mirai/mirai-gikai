import "server-only";

import {
  buildOgFontOptions,
  fetchWithTimeout,
  loadNotoSansJp,
  loadOgpLogoDataUrl,
  OG_FONT_FAMILY,
} from "@mirai-gikai/shared/og/assets";
import { ImageResponse } from "next/og";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_TITLE_FONT_SIZE,
  SHARE_IMAGE_TITLE_LEFT,
  SHARE_IMAGE_TITLE_LETTER_SPACING_EM,
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

const PHOTO_FETCH_TIMEOUT_MS = 5000;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png"];
const OVERLAY_OPACITY = 0.4;
const FALLBACK_BACKGROUND = "#C8C8C8";
const TEXT_COLOR = "#1F2937";
const FONT_WEIGHT = 700;

const frameDataUrl = `data:image/svg+xml;base64,${Buffer.from(
  buildShareImageFrameSvg()
).toString("base64")}`;

/** photoUrl は呼び出し側で isAllowedSharePhotoUrl を通したものに限る */
async function loadPhoto(photoUrl: string): Promise<string> {
  const res = await fetchWithTimeout(
    photoUrl,
    { redirect: "error" },
    PHOTO_FETCH_TIMEOUT_MS
  );
  if (!res.ok) throw new Error("背景写真の取得に失敗しました");
  const contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
  if (!PHOTO_CONTENT_TYPES.includes(contentType)) {
    throw new Error("背景写真は JPEG か PNG にしてください");
  }
  if (Number(res.headers.get("content-length")) > PHOTO_MAX_BYTES) {
    throw new Error("背景写真は5MB以下にしてください");
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
  const [font, logo, photo] = await Promise.all([
    loadNotoSansJp(FONT_WEIGHT),
    loadOgpLogoDataUrl(),
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
        fontFamily: OG_FONT_FAMILY,
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
          fontWeight: FONT_WEIGHT,
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
          fontWeight: FONT_WEIGHT,
          lineHeight: `${SHARE_IMAGE_TITLE_LINE_HEIGHT}px`,
          letterSpacing: `${SHARE_IMAGE_TITLE_LETTER_SPACING_EM}em`,
        }}
      >
        {params.lines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 行の並びは固定
          <div key={index} style={{ display: "flex" }}>
            {line}
          </div>
        ))}
      </div>
      {logo && (
        // biome-ignore lint/performance/noImgElement: Satori は img のみ対応
        <img
          alt="チームみらいロゴ"
          src={logo}
          width={logoBox.width}
          height={logoBox.height}
          style={{
            position: "absolute",
            top: logoBox.top,
            left: logoBox.left,
          }}
        />
      )}
    </div>,
    {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      ...buildOgFontOptions(font, FONT_WEIGHT),
    }
  );
}
