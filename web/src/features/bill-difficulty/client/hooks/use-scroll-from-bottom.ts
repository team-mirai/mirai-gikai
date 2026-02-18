import { useEffect } from "react";

const STORAGE_KEY = "scroll-distance-from-bottom";

/**
 * 画面下端からの距離を保存
 */
export function saveScrollDistanceFromBottom() {
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  const windowHeight = window.innerHeight;
  const distanceFromBottom = documentHeight - scrollTop - windowHeight;
  sessionStorage.setItem(STORAGE_KEY, distanceFromBottom.toString());
}

/**
 * 画面下端からの距離を復元してスクロール位置を調整するフック
 */
export function useRestoreScrollFromBottom(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const savedDistance = sessionStorage.getItem(STORAGE_KEY);
    if (savedDistance) {
      const distanceFromBottom = Number.parseFloat(savedDistance);
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const targetScrollTop =
        documentHeight - windowHeight - distanceFromBottom;

      window.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "instant",
      });

      // 使用後は削除
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [enabled]);
}
