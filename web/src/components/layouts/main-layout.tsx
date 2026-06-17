"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  isInterviewSection,
  isMainPage,
  isTopPage,
} from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname);
  const isInterview = isInterviewSection(pathname);
  const isTop = isTopPage(pathname);

  return (
    <div
      className={cn(
        "relative max-w-[700px] mx-auto",
        // 固定ヘッダー（top-4 + h-16 ≈ 80px）に本文が潜らないよう上余白を確保する。
        // パンくず等が埋もれるのを防ぐため全幅で mt-24 を適用する。
        // ただしTOPページはヒーローを画面最上部に出す元の仕様に戻し、
        // モバイルでは余白なし・md以上でのみ mt-24 とする。
        isTop ? "md:mt-24" : "mt-24",
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
