import { GoogleAnalytics } from "@next/third-parties/google";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { AuthGate } from "@/components/layouts/auth-gate";
import { env } from "@/lib/env";

/**
 * 開発者向けのフル幅レイアウト。
 * サイト標準の MainLayout はモバイルファーストの1カラム（max-w-700px）だが、
 * APIリファレンス等のドキュメントは横幅を要するため制約なしで表示する。
 */
export default function DevelopersGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <GoogleAnalytics gaId={env.analytics.gaTrackingId ?? ""} />
      <AuthGate />
      <Header />
      {/* 背景は (main) 配下の開発者向けページ（bg-mirai-surface）と揃える */}
      <main className="min-h-dvh bg-mirai-surface pt-24">{children}</main>
    </>
  );
}
