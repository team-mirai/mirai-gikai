import { ImageResponse } from "next/og";
import {
  findPublicReportWithSessionById,
  findBillWithContentById,
} from "@/features/interview-report/server/repositories/interview-report-repository";

const OG_SUMMARY_MAX_LENGTH = 120;

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap";

/** フォントデータをモジュールレベルでキャッシュ */
let cachedFontData: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer | null> {
  if (cachedFontData) return cachedFontData;

  try {
    const css = await fetch(GOOGLE_FONTS_URL).then((res) => res.text());
    const fontUrl = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)?.[1];
    if (!fontUrl) return null;
    cachedFontData = await fetch(fontUrl).then((r) => r.arrayBuffer());
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

  let summary = "";
  let billName = "";

  try {
    const report = await findPublicReportWithSessionById(reportId);
    const session = report.interview_sessions as {
      started_at: string;
      completed_at: string | null;
      interview_configs: { bill_id: string } | null;
    } | null;

    if (session?.interview_configs) {
      const bill = await findBillWithContentById(
        session.interview_configs.bill_id
      );
      const billContent = bill.bill_contents
        ? Array.isArray(bill.bill_contents)
          ? bill.bill_contents[0]
          : bill.bill_contents
        : null;
      billName = billContent?.title || bill.name;
    }

    summary = report.summary || "";
  } catch {
    return new Response("Report not found", { status: 404 });
  }

  const truncatedSummary =
    summary.length > OG_SUMMARY_MAX_LENGTH
      ? `${summary.slice(0, OG_SUMMARY_MAX_LENGTH)}...`
      : summary;

  const fontData = await loadFont();
  const fonts: {
    name: string;
    data: ArrayBuffer;
    style: "normal";
    weight: 400;
  }[] = fontData
    ? [{ name: "Noto Sans JP", data: fontData, style: "normal", weight: 400 }]
    : [];

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
            fontWeight: 400,
            color: "#1f2937",
            lineHeight: 1.8,
            flex: 1,
            width: 700,
          }}
        >
          {truncatedSummary}
        </div>

        {/* 法案名 */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 700,
            color: "#0f8472",
            lineHeight: 1.5,
          }}
        >
          {billName}
        </div>

        {/* みらい議会バッジ */}
        <div
          style={{
            position: "absolute",
            top: 32,
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
              fontWeight: 700,
              color: "#1f2937",
              letterSpacing: "0.03em",
            }}
          >
            みらい議会
          </span>
        </div>

        {/* ロゴテキスト */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0f8472",
              letterSpacing: "0.08em",
            }}
          >
            チーム
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0f8472",
              letterSpacing: "0.08em",
            }}
          >
            みらい
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
