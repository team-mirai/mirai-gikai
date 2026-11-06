/**
 * 法案カードに出す淡色のピル。
 *
 * 「AIインタビュー受付中」や回答数のように、タグ（BillTag）とは別系統の
 * 補足情報を並べるために使う。同じクラス文字列がカード内で複数回出るのを防ぐ。
 */
export function BillPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-mirai-light-gradient px-3 py-1 text-xs font-medium text-black">
      {children}
    </span>
  );
}
