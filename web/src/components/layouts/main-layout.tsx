"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isInterviewSection } from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isInterview = isInterviewSection(pathname);

  return (
    <div
      className={cn(
        "relative max-w-[700px] mx-auto md:mt-24",
        // インタビューページ以外ではshadowを表示
        !isInterview && "sm:shadow-lg"
      )}
    >
      {children}
    </div>
  );
}
