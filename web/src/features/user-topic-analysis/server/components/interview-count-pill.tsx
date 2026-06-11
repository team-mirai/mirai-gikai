import "server-only";

import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

/** 回答者の多様性を表す装飾用アバタークラスタの色。 */
const AVATAR_CLASSES = [
  "bg-mirai-gradient",
  "bg-topic-industry",
  "bg-primary",
  "bg-topic-affected",
  "bg-stance-against-light",
];

interface InterviewCountPillProps {
  count: number;
  href: string;
}

/** 「N人のAIインタビュー回答から」へ遷移するピル。回答一覧ページにリンクする。 */
export function InterviewCountPill({ count, href }: InterviewCountPillProps) {
  return (
    <Link
      href={href as Route}
      prefetch={false}
      className="inline-flex items-center gap-2 self-start rounded-full bg-white px-2.5 py-1.5"
    >
      <span className="flex items-center">
        {AVATAR_CLASSES.map((cls, index) => (
          <span
            key={cls}
            className={`size-4 rounded-lg border border-white ${cls} ${index > 0 ? "-ml-1" : ""}`}
          />
        ))}
      </span>
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-mirai-text">
        <span>
          <span className="font-bold">{count}人</span>
          のAIインタビュー回答から
        </span>
        <ChevronRight className="size-[11px] shrink-0" />
      </span>
    </Link>
  );
}
