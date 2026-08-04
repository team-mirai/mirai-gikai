"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** ページ表示のたびに(pathnameが変わるたびに)effectを実行する */
export function useOnPageView(effect: () => void) {
  const pathname = usePathname();
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathnameが変わるたびに再実行するため意図的に依存配列に含めている
  useEffect(() => {
    effect();
  }, [pathname]);
}
