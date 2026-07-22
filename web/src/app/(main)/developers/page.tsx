import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
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

// Team Mirai デザインシステム準拠: 白背景カード + 1px黒ボーダー + 小さめの角丸。
// ホバーはリンク色を teal-hover へ寄せる（不透明度やスケールは使わない）
const cardClassName =
  "group flex items-center gap-4 rounded-lg border border-black bg-white p-5 transition-colors duration-150";

function LinkCardBody({
  icon: Icon,
  title,
  external,
}: {
  icon: typeof Database;
  title: string;
  external: boolean;
}) {
  const Arrow = external ? ArrowUpRight : ArrowRight;
  return (
    <>
      <Icon className="size-6 shrink-0 text-mirai-brand-teal-hover" />
      <p className="flex-1 font-semibold tracking-wide text-black transition-colors duration-150 group-hover:text-mirai-brand-teal-hover">
        {title}
      </p>
      <Arrow className="size-5 shrink-0 text-black transition-colors duration-150 group-hover:text-mirai-brand-teal-hover" />
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

          {/* ミントのセクション背景（デザインシステムのシグネチャ）にカードを並べる */}
          <div className="rounded-lg bg-mirai-brand-mint p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {links.map(({ href, external, ...item }) =>
                external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClassName}
                  >
                    <LinkCardBody external {...item} />
                  </a>
                ) : (
                  <Link key={href} href={href} className={cardClassName}>
                    <LinkCardBody external={false} {...item} />
                  </Link>
                )
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
