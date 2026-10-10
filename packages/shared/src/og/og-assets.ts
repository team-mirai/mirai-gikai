import { readFile } from "node:fs/promises";
import { join } from "node:path";

const FONT_FETCH_TIMEOUT_MS = 3000;
export const OG_FONT_FAMILY = "Noto Sans JP";

export async function fetchWithTimeout(
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

export function extractFontUrlFromCss(css: string): string | null {
  return (
    css
      .match(/src:\s*url\(([^)]+)\)\s*format\('(opentype|truetype)'\)/)?.[1]
      ?.replace(/^["']|["']$/g, "") ?? null
  );
}

/** Satori は woff2 を読めないので、User-Agent を送らずに TTF を取得する */
async function fetchNotoSansJp(weight: number): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetchWithTimeout(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&display=swap`
    );
    if (!cssRes.ok) return null;
    const fontUrl = extractFontUrlFromCss(await cssRes.text());
    if (!fontUrl) return null;
    const fontRes = await fetchWithTimeout(fontUrl);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

const fontPromises = new Map<number, Promise<ArrayBuffer | null>>();

/** 同じ weight の取得は1回にまとめ、失敗時は次回呼び出しで再試行する */
export function loadNotoSansJp(weight: number): Promise<ArrayBuffer | null> {
  const cached = fontPromises.get(weight);
  if (cached) return cached;
  const promise = fetchNotoSansJp(weight).then((data) => {
    if (!data) fontPromises.delete(weight);
    return data;
  });
  fontPromises.set(weight, promise);
  return promise;
}

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** 取得に失敗した場合は fonts を省略し、ImageResponse のデフォルトフォントに任せる */
export function buildOgFontOptions(data: ArrayBuffer | null, weight: FontWeight) {
  return data
    ? {
        fonts: [
          {
            name: OG_FONT_FAMILY,
            data,
            style: "normal" as const,
            weight,
          },
        ],
      }
    : {};
}

let logoPromise: Promise<string | null> | null = null;

/** フォーク先で差し替えられるよう、web/public のロゴを唯一の置き場所として読む */
export function loadOgpLogoDataUrl(): Promise<string | null> {
  if (!logoPromise) {
    logoPromise = readFile(
      join(process.cwd(), "..", "web", "public", "img", "ogp-logo.png")
    )
      .then((buf) => `data:image/png;base64,${buf.toString("base64")}`)
      .catch(() => {
        logoPromise = null;
        return null;
      });
  }
  return logoPromise;
}
