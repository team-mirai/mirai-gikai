import "server-only";

import { join } from "node:path";
import {
  loadNotoSansJp,
  loadOgpLogoDataUrl,
  OG_FONT_FAMILY,
} from "@mirai-gikai/shared/og/assets";
import { ImageResponse } from "next/og";
import {
  BREAKING_NEWS_TITLE_FONT_SIZE,
  BREAKING_NEWS_TITLE_MAX_WIDTH,
  type BreakingNewsImageInput,
  type BreakingNewsStance,
  type BreakingNewsStepState,
  isPositiveBreakingNewsResult,
} from "../../shared/utils/breaking-news-image";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_TITLE_LEFT,
  SHARE_IMAGE_TITLE_LETTER_SPACING_EM,
  SHARE_IMAGE_WIDTH,
} from "../../shared/utils/share-image";
import {
  buildShareImageFrameSvg,
  SHARE_IMAGE_FRAME,
  SHARE_IMAGE_LOGO,
  SHARE_IMAGE_TAB,
} from "../../shared/utils/share-image-frame";

// next.config の outputFileTracingIncludes と同じパスを指す
const OGP_LOGO_PATH = join(
  process.cwd(),
  "../packages/shared/src/og/ogp-logo.png"
);

const BOLD = 700;
const BLACK = 900;
const TEXT_COLOR = "#1F2937";
const MUTED_COLOR = "#6B7280";
const TODO_COLOR = "#D2D2D2";
const TODO_LABEL_COLOR = "#B0B0B0";
// 成立・可決はティール、否決・廃案は濃いグレー。赤は党の賛否の印象が出るので使わない
const POSITIVE_COLOR = "#0F8472";
const GRADIENT = "linear-gradient(90deg, #64D8C6, #BCECD3)";
const FOOTER_TEXT = "法案の中身は、みらい議会でやさしく解説しています";
// みらい議会の賛否バッジ(web の stance-styles.ts と globals.css)と同じ色
const STANCE_COLORS: Record<
  BreakingNewsStance["tone"],
  { bg: string; text: string }
> = {
  for: { bg: "#ECFCF1", text: "#0F8472" },
  against: { bg: "#FFF1F1", text: "#C9272A" },
  other: { bg: "#E5E5EA", text: TEXT_COLOR },
};

const LEFT = SHARE_IMAGE_TITLE_LEFT;
const PILL = { top: 104, height: 76 } as const;
const RESULT = { top: 168, fontSize: 230 } as const;
const STEPS = { left: 720, right: 1396, centerY: 300, radius: 26 } as const;
const ACCENT_BAR_TOP = 458;
const TITLE_TOP = 510;
const TITLE_LINE_HEIGHT = 102;
const FOOTER_TOP = 800;
const STANCE_ROW = { top: 752, height: 72 } as const;

const frameDataUrl = `data:image/svg+xml;base64,${Buffer.from(
  buildShareImageFrameSvg()
).toString("base64")}`;

// 止まった段の丸に重ねる白い×
const crossDataUrl = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 4L20 20M20 4L4 20" stroke="white" stroke-width="5" stroke-linecap="round"/></svg>'
).toString("base64")}`;

export async function loadBreakingNewsImageAssets() {
  const [bold, black, logo] = await Promise.all([
    loadNotoSansJp(BOLD),
    loadNotoSansJp(BLACK),
    loadOgpLogoDataUrl(OGP_LOGO_PATH),
  ]);
  return { bold, black, logo };
}

/** 日本語フォントやロゴが欠けた画像を配らないよう、すべて揃ったものだけを受け取る */
export type BreakingNewsImageAssets = {
  bold: ArrayBuffer;
  black: ArrayBuffer;
  logo: string;
};

function stepColors(state: BreakingNewsStepState, color: string) {
  if (state === "stopped") return { circle: TEXT_COLOR, label: TEXT_COLOR };
  if (state === "done") return { circle: color, label: color };
  return { circle: TODO_COLOR, label: TODO_LABEL_COLOR };
}

function Steps({
  steps,
  color,
}: {
  steps: BreakingNewsImageInput["steps"];
  color: string;
}) {
  const { left, right, centerY, radius } = STEPS;
  const gap = (right - left) / (steps.length - 1);
  return (
    <>
      {steps.slice(1).map((step, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: 段の並びは固定
          key={`line-${index}`}
          style={{
            position: "absolute",
            top: centerY - 4,
            left: left + index * gap + radius,
            width: gap - radius * 2,
            height: 8,
            backgroundColor: step.state === "todo" ? TODO_COLOR : color,
          }}
        />
      ))}
      {steps.map((step, index) => {
        const x = left + index * gap;
        const colors = stepColors(step.state, color);
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: 段の並びは固定
            key={`step-${index}`}
            style={{
              position: "absolute",
              top: centerY - radius,
              left: x - 120,
              width: 240,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  step.state === "todo" ? "white" : colors.circle,
                border:
                  step.state === "todo" ? `6px solid ${TODO_COLOR}` : "none",
              }}
            >
              {step.state === "stopped" && (
                // biome-ignore lint/performance/noImgElement: Satori は img のみ対応
                <img alt="" src={crossDataUrl} width={24} height={24} />
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 34,
                fontWeight: BOLD,
                color: colors.label,
              }}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </>
  );
}

export async function renderBreakingNewsImage(params: {
  input: BreakingNewsImageInput;
  assets: BreakingNewsImageAssets;
}): Promise<ImageResponse> {
  const { input, assets } = params;
  const frame = SHARE_IMAGE_FRAME;
  const tab = SHARE_IMAGE_TAB;
  const logoBox = SHARE_IMAGE_LOGO;
  const color = isPositiveBreakingNewsResult(input.result)
    ? POSITIVE_COLOR
    : TEXT_COLOR;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "white",
        fontFamily: OG_FONT_FAMILY,
        color: TEXT_COLOR,
      }}
    >
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
          fontWeight: BOLD,
          letterSpacing: "0.08em",
        }}
      >
        みらい議会
      </div>

      <div
        style={{
          position: "absolute",
          top: PILL.top,
          left: LEFT,
          height: PILL.height,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            height: PILL.height,
            paddingLeft: 34,
            paddingRight: 30,
            display: "flex",
            alignItems: "center",
            borderRadius: PILL.height / 2,
            border: `3px solid ${TEXT_COLOR}`,
            backgroundImage: GRADIENT,
            fontSize: 44,
            fontWeight: BLACK,
            letterSpacing: "0.1em",
          }}
        >
          速報
        </div>
        {input.meta && (
          <div
            style={{
              marginLeft: 30,
              display: "flex",
              fontSize: 44,
              fontWeight: BOLD,
            }}
          >
            {input.meta}
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: RESULT.top,
          left: LEFT - 8,
          display: "flex",
          fontSize: RESULT.fontSize,
          fontWeight: BLACK,
          lineHeight: 1.2,
          color,
        }}
      >
        {input.result}
      </div>

      <Steps steps={input.steps} color={color} />

      <div
        style={{
          position: "absolute",
          top: ACCENT_BAR_TOP,
          left: LEFT,
          width: BREAKING_NEWS_TITLE_MAX_WIDTH,
          height: 10,
          borderRadius: 5,
          backgroundImage: GRADIENT,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: TITLE_TOP,
          left: LEFT,
          width: BREAKING_NEWS_TITLE_MAX_WIDTH,
          display: "flex",
          flexDirection: "column",
          fontSize: BREAKING_NEWS_TITLE_FONT_SIZE,
          fontWeight: BOLD,
          lineHeight: `${TITLE_LINE_HEIGHT}px`,
          letterSpacing: `${SHARE_IMAGE_TITLE_LETTER_SPACING_EM}em`,
        }}
      >
        {input.titleLines.map((line, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 行の並びは固定
          <div key={index} style={{ display: "flex" }}>
            {line}
          </div>
        ))}
      </div>

      {input.stance ? (
        <div
          style={{
            position: "absolute",
            top: STANCE_ROW.top,
            left: LEFT,
            height: STANCE_ROW.height,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 40, fontWeight: BOLD }}>
            チームみらいの賛否
          </div>
          <div
            style={{
              marginLeft: 24,
              height: STANCE_ROW.height,
              paddingLeft: 32,
              paddingRight: 32,
              display: "flex",
              alignItems: "center",
              borderRadius: STANCE_ROW.height / 2,
              backgroundColor: STANCE_COLORS[input.stance.tone].bg,
              color: STANCE_COLORS[input.stance.tone].text,
              fontSize: 44,
              fontWeight: BLACK,
              letterSpacing: "0.05em",
            }}
          >
            {input.stance.label}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: FOOTER_TOP,
            left: LEFT,
            display: "flex",
            fontSize: 36,
            fontWeight: BOLD,
            color: MUTED_COLOR,
          }}
        >
          {FOOTER_TEXT}
        </div>
      )}

      {/* biome-ignore lint/performance/noImgElement: Satori は img のみ対応 */}
      <img
        alt="チームみらいロゴ"
        src={assets.logo}
        width={logoBox.width}
        height={logoBox.height}
        style={{ position: "absolute", top: logoBox.top, left: logoBox.left }}
      />
    </div>,
    {
      width: SHARE_IMAGE_WIDTH,
      height: SHARE_IMAGE_HEIGHT,
      fonts: [
        { name: OG_FONT_FAMILY, data: assets.bold, weight: BOLD },
        { name: OG_FONT_FAMILY, data: assets.black, weight: BLACK },
      ],
    }
  );
}
