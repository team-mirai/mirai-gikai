import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Database,
  Github,
  ScrollText,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "開発者向け | みらい議会",
  description:
    "みらい議会のオープンデータAPIなど、開発者・研究者向けの情報をまとめています。",
};

const links = [
  {
    href: routes.developersOpenDataApi(),
    icon: Database,
    title: "オープンデータAPI",
    external: false,
  },
  {
    href: routes.interviewDataTerms(),
    icon: ScrollText,
    title: "みらい議会AIインタビューデータ利用規約",
    external: false,
  },
  {
    href: EXTERNAL_LINKS.GITHUB_REPO,
    icon: Github,
    title: "GitHubリポジトリ",
    external: true,
  },
  {
    href: EXTERNAL_LINKS.FORK_GUIDELINES_NOTE,
    icon: BookOpen,
    title: "自主制作ガイドライン",
    external: true,
  },
];

// Team Mirai デザインシステムの news-list パターン:
// 区切り線（1px #e5e5e5 = neutral-200）で仕切った行 + 右端に teal のシェブロン。
// ホバーはリンク色を teal-hover へ寄せる（不透明度やスケールは使わない）
const rowClassName =
  "group flex items-center gap-4 border-b border-neutral-200 py-4 transition-colors duration-150";

function LinkRowBody({
  icon: Icon,
  title,
  external,
}: {
  icon: typeof Database;
  title: string;
  external: boolean;
}) {
  const Chevron = external ? ArrowUpRight : ChevronRight;
  return (
    <>
      <Icon className="size-5 shrink-0 text-mirai-brand-teal-hover" />
      <p className="flex-1 text-[15px] font-medium leading-relaxed tracking-wide text-black transition-colors duration-150 group-hover:text-mirai-brand-teal-hover">
        {title}
      </p>
      <Chevron className="size-5 shrink-0 text-mirai-brand-teal-hover" />
    </>
  );
}

export default function DevelopersPage() {
  return (
    <div className="min-h-dvh bg-white">
      <section className="py-12 pt-24 md:pt-12">
        <Container className="space-y-10">
          {/* Team Mirai デザインシステムの節見出し: 英字ラベル + 日本語見出し */}
          <header className="space-y-2">
            <p className="font-lexend text-sm font-semibold tracking-[0.14em] text-mirai-brand-teal-hover">
              Developers
            </p>
            <h1 className="text-2xl font-bold tracking-wider text-black sm:text-3xl">
              開発者向け
            </h1>
          </header>

          <p className="text-[15px] leading-loose tracking-wide text-mirai-text-subtle">
            みらい議会では、AIインタビューに寄せられた法案への意見を、誰でも分析・活用できるオープンデータとして公開しています。
          </p>

          <div className="flex flex-col border-t border-neutral-200">
            {links.map(({ href, external, ...item }) =>
              external ? (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={rowClassName}
                >
                  <LinkRowBody external {...item} />
                </a>
              ) : (
                <Link key={href} href={href} className={rowClassName}>
                  <LinkRowBody external={false} {...item} />
                </Link>
              )
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
