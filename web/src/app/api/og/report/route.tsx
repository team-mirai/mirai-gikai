import {
  buildOgFontOptions,
  loadNotoSansJp,
  loadOgpLogoDataUrl,
} from "@mirai-gikai/shared/og/assets";
import { ImageResponse } from "next/og";
import { getReportOgData } from "@/features/interview-report/server/loaders/get-report-og-data";
import { truncateText } from "@/features/interview-report/shared/utils/truncate-text";

/**
 * OGP画像のテキスト制限
 */
const OG_SUMMARY_MAX_LENGTH = 100;
const OG_BILL_NAME_MAX_LENGTH = 40;
const OG_BILL_NAME_WIDTH = 820;
const OG_BILL_NAME_MAX_HEIGHT = 96;

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

  const [fontData, logoDataUrl] = await Promise.all([
    loadNotoSansJp(800),
    loadOgpLogoDataUrl(),
  ]);
  const fontOptions = buildOgFontOptions(fontData, 800);

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
      {/* グラデーションborder用ラッパー */}
      <div
        style={{
          display: "flex",
          width: 1140,
          height: 560,
          borderRadius: 30,
          backgroundImage:
            "linear-gradient(-30deg, rgb(188, 236, 211) 1%, rgb(100, 216, 198) 99%)",
          padding: 6,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "white",
            borderRadius: 24,
            padding: "48px 56px",
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
              width: 740,
              overflow: "hidden",
            }}
          >
            {truncatedSummary}
          </div>

          {/* 法案名 */}
          <div
            style={{
              display: "flex",
              width: OG_BILL_NAME_WIDTH,
              maxHeight: OG_BILL_NAME_MAX_HEIGHT,
              fontSize: 32,
              fontWeight: 800,
              color: "#0f8472",
              lineHeight: 1.5,
              overflow: "hidden",
              wordBreak: "break-all",
            }}
          >
            {truncatedBillName}
          </div>
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
            paddingRight: 18,
            paddingTop: 10,
            paddingBottom: 10,
            borderBottomLeftRadius: 30,
            borderTopRightRadius: 30,
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
          // biome-ignore lint/performance/noImgElement: ignore
          <img
            alt="チームみらいロゴ"
            src={logoDataUrl}
            width={189}
            height={160}
            style={{
              position: "absolute",
              bottom: -24,
              right: -18,
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
