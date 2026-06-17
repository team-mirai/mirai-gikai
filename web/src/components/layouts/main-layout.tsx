"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isInterviewSection, isMainPage } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname);
  const isInterview = isInterviewSection(pathname);

  return (
    <div
      className={cn(
        // 固定ヘッダー（top-4 + h-16 ≈ 80px）に本文が潜らないよう上余白を確保する。
        // モバイルで余白が無くパンくず等が埋もれていたため md: 限定をやめ全幅で適用。
        "relative max-w-[700px] mx-auto mt-24",
        // インタビューページ以外ではshadowを表示
        !isInterview && "sm:shadow-lg",
        // TOPページと法案詳細ページのみ、チャットサイドバー用のオフセット
        useSidebarLayout && "pc:mr-[500px] xl:ml-[calc(calc(100vw-1180px)/2)]"
      )}
    >
      {children}
    </div>
  );
}
