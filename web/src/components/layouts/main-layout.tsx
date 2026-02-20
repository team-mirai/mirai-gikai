"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isInterviewPage, isMainPage } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname);
  const isInterviewChat = isInterviewPage(pathname);

  return (
    <div
      className={cn(
        "relative max-w-[700px] mx-auto sm:shadow-lg md:mt-24",
        // TOPページと法案詳細ページのみ、チャットサイドバー用のオフセット
        useSidebarLayout && "pc:mr-[500px] xl:ml-[calc(calc(100vw-1180px)/2)]",
        // インタビューチャットページではページ全体のスクロールを防止
        isInterviewChat && "md:max-h-[calc(100dvh-96px)] md:overflow-hidden"
      )}
    >
      {children}
    </div>
  );
}
