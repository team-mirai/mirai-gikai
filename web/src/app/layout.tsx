import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Lexend_Giga, Noto_Sans_JP } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { AuthGate } from "@/components/layouts/auth-gate";
import { Footer } from "@/components/layouts/footer/footer";
import { MainLayout } from "@/components/layouts/main-layout";
import { env } from "@/lib/env";
import { RubyfulInitializer } from "@/lib/rubyful";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const lexendGiga = Lexend_Giga({
  variable: "--font-lexend-giga",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const isDev = process.env.NODE_ENV === "development";
const siteTitle = "みらい議会｜チームみらい";
const siteDescription =
  "国会で今どんな法案が検討されているか、わかりやすく伝えるプラットフォーム";
const siteName = "みらい議会";
const ogImage = {
  url: "/ogp.jpg",
  width: 1200,
  height: 630,
  alt: "みらい議会のOGPイメージ",
};

export const metadata: Metadata = {
  metadataBase: new URL(env.webUrl),
  title: siteTitle,
  description: siteDescription,
  keywords: [siteName, "議案", "政治", "日本", "政策", "解説", "チームみらい"],
  icons: {
    icon: isDev
      ? "/icons/pwa/icon_dev_192_v3.png"
      : "/icons/pwa/icon_android_192.png",
    apple: "/icons/pwa/icon_ios.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2aa693",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${lexendGiga.variable} font-sans antialiased bg-[#EEEEEE]`}
      >
        <NextTopLoader showSpinner={false} color="#2aa693" />
        <SpeedInsights />
        <GoogleAnalytics gaId={env.analytics.gaTrackingId ?? ""} />
        <RubyfulInitializer />
        <AuthGate />

        <MainLayout>
          <Header />
          <main className="min-h-dvh bg-[#F7F4F0]">{children}</main>
          <Footer />
        </MainLayout>
      </body>
    </html>
  );
}
