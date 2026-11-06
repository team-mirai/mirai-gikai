import type { Route } from "next";
import Link from "next/link";

/**
 * タグ1つ分のチップ。カテゴリタブと検索モーダルの両方で使う。
 *
 * 同じ見た目を2箇所に書くと、トークンを1つ変えるだけで片方だけ古くなる。
 */
export function TagChipLink({
  href,
  label,
  count,
  className,
  onNavigate,
}: {
  href: Route;
  label: string;
  count: number;
  className?: string;
  /** モーダルの中から使うとき、遷移前に閉じるために使う。 */
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-mirai-border bg-white px-3.5 text-[13px] font-bold text-mirai-text ${className ?? ""}`}
    >
      {label}
      <span className="font-lexend text-xs font-bold text-mirai-text-muted">
        {count}
      </span>
    </Link>
  );
}
