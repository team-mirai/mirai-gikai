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
import {
  LegalPageLayout,
  LegalParagraph,
} from "@/components/layouts/legal-page-layout";
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

const cardClassName =
  "group flex items-center gap-4 rounded-xl border border-slate-200 p-5 transition-colors hover:border-primary-accent";

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
      <Icon className="size-6 shrink-0 text-primary-accent" />
      <p className="flex-1 font-semibold text-slate-900">{title}</p>
      <Arrow className="size-5 shrink-0 text-slate-400 transition-colors group-hover:text-primary-accent" />
    </>
  );
}

export default function DevelopersPage() {
  return (
    <LegalPageLayout
      title="開発者向け"
      description="みらい議会のオープンデータAPIなど、開発者・研究者向けの情報をまとめています。"
      className="pt-24 md:pt-12"
    >
      <Container className="space-y-6">
        <LegalParagraph>
          みらい議会では、AIインタビューに寄せられた法案への意見を、誰でも分析・活用できるオープンデータとして公開しています。
        </LegalParagraph>

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
      </Container>
    </LegalPageLayout>
  );
}
