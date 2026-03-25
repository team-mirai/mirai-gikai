import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getReportOgData } from "@/features/interview-report/server/loaders/get-report-og-data";
import { truncateText } from "@/features/interview-report/shared/utils/truncate-text";

/**
 * OGP画像のテキスト制限
 * カード: 1080x530px, padding 48px, font 38px × lineHeight 1.8 = 68.4px/行
 * 幅700pxで日本語約18文字/行 → 5行 = 約90文字が上限
 */
const OG_SUMMARY_MAX_LENGTH = 80;
const OG_BILL_NAME_MAX_LENGTH = 40;

const FONT_FETCH_TIMEOUT_MS = 3000;

/** タイムアウト付きfetch */
async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = FONT_FETCH_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** フォントデータをモジュールレベルでキャッシュ */
let cachedFontData: ArrayBuffer | null = null;

/** ロゴ画像のBase64データをモジュールレベルでキャッシュ */
let cachedLogoDataUrl: string | null = null;

async function loadLogo(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const logoPath = join(process.cwd(), "public/img/ogp-logo.png");
    const buf = await readFile(logoPath);
    cachedLogoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

/**
 * Google Fontsからフォントデータを取得する。
 * User-Agentを送らないことでTTF形式を取得する（Satoriはwoff2非対応）。
 */
async function loadFont(): Promise<ArrayBuffer | null> {
  if (cachedFontData) return cachedFontData;

  try {
    const url =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@800&display=swap";
    const cssRes = await fetchWithTimeout(url);
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const fontUrl = css
      .match(/src:\s*url\(([^)]+)\)\s*format\('(opentype|truetype)'\)/)?.[1]
      ?.replace(/^["']|["']$/g, "");
    if (!fontUrl) return null;
    const fontRes = await fetchWithTimeout(fontUrl);
    if (!fontRes.ok) return null;
    cachedFontData = await fontRes.arrayBuffer();
    return cachedFontData;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("id");

  if (!reportId) {
    return new Response("Missing id parameter", { status: 400 });
  }

  let data: Awaited<ReturnType<typeof getReportOgData>>;
  try {
    data = await getReportOgData(reportId);
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
  if (!data) {
    return new Response("Report not found", { status: 404 });
  }

  const truncatedSummary = truncateText(data.summary, OG_SUMMARY_MAX_LENGTH);
  const truncatedBillName = truncateText(
    data.billName,
    OG_BILL_NAME_MAX_LENGTH
  );

  const [fontData, logoDataUrl] = await Promise.all([loadFont(), loadLogo()]);
  // フォント取得失敗時はプロパティ自体を省略し、デフォルトフォントにフォールバック
  const fontOptions = fontData
    ? {
        fonts: [
          {
            name: "Noto Sans JP",
            data: fontData,
            style: "normal" as const,
            weight: 800 as const,
          },
        ],
      }
    : {};

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage:
          "linear-gradient(177deg, rgb(226, 246, 243) 0%, rgb(238, 246, 226) 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 1080,
          height: 530,
          backgroundColor: "white",
          borderRadius: 28,
          border: "4px solid #bcecd3",
          padding: "48px 56px",
          position: "relative",
        }}
      >
        {/* サマリーテキスト */}
        <div
          style={{
            display: "flex",
            fontSize: 38,
            fontWeight: 800,
            color: "#1f2937",
            lineHeight: 1.8,
            flex: 1,
            width: 700,
            overflow: "hidden",
          }}
        >
          {truncatedSummary}
        </div>

        {/* 法案名 */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 800,
            color: "#0f8472",
            lineHeight: 1.5,
          }}
        >
          {truncatedBillName}
        </div>

        {/* みらい議会バッジ */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
            borderBottomLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundImage:
              "linear-gradient(-30deg, rgb(188, 236, 211) 1%, rgb(100, 216, 198) 99%)",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#1f2937",
              letterSpacing: "0.03em",
            }}
          >
            みらい議会
          </span>
        </div>

        {/* ロゴ画像 */}
        {logoDataUrl && (
          <img
            alt="チームみらいロゴ"
            src={logoDataUrl}
            width={109}
            height={93}
            style={{
              position: "absolute",
              bottom: 32,
              right: 48,
            }}
          />
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      ...fontOptions,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
