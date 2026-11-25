import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  experimental: {
    serverSourceMaps: true,
  },
  typedRoutes: true,
  // Next.js 15.2+ は generateMetadata の結果を body 側にストリーミングするが、
  // 既定では Googlebot がその対象になり、初期HTMLの <head> に <title> が入らない。
  // 検索結果のタイトルが URL 表示になるのを防ぐため、Next.js 既定の bot 一覧に
  // Googlebot を加え、ブロッキングで <head> に出力する。
  // HTML_LIMITED_BOT_UA_RE は Next.js 内部モジュールのため、Next 更新時に
  // import が壊れていないか確認すること（Next 側で大文字小文字無視で再構築される）。
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|Googlebot`),
  outputFileTracingIncludes: {
    "/api/og/report": ["../packages/shared/src/og/ogp-logo.png"],
  },
  redirects: async () => [
    {
      // データ利用規約を /developers 配下へ移動した際の旧URL互換
      source: "/interview-data-terms",
      destination: "/developers/interview-data-terms",
      permanent: true,
    },
  ],
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/bill-thumbnails/**",
      },
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "placehold.co",
            },
          ]
        : []),
    ],
    ...(isDev && {
      dangerouslyAllowSVG: true,
      contentDispositionType: "attachment" as const,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'none'; sandbox;",
    }),
  },
};

export default nextConfig;
