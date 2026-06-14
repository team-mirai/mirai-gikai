import { DesktopMenuLinks } from "./links";

/**
 * デスクトップメニュー: サイドバー (画面左下)
 */
export function DesktopMenuSidebar() {
  return (
    <aside className="fixed bottom-6 left-6 z-40 flex flex-col gap-4 w-[240px]">
      <DesktopMenuLinks />
    </aside>
  );
}
