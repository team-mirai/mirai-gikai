import type { Route } from "next";
import Link from "next/link";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { routes } from "@/lib/routes";

type FooterLinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

const links: FooterLinkItem[] = [
  {
    label: "本家「みらい議会」",
    href: EXTERNAL_LINKS.ORIGINAL_MIRAI_GIKAI,
    external: true,
  },
  {
    label: "ソースコード",
    href: EXTERNAL_LINKS.SOURCE_CODE,
    external: true,
  },
  {
    label: "利用規約",
    href: routes.terms(),
    external: false,
  },
  {
    label: "プライバシーポリシー",
    href: routes.privacy(),
    external: false,
  },
];

/**
 * デスクトップメニュー: フッターリンク（サイドバー内）
 */
export function DesktopMenuLinks() {
  return (
    <div className="flex flex-col gap-1.5">
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href as Route}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noreferrer" : undefined}
          className="font-medium text-xs transition-opacity hover:opacity-70"
          style={{
            lineHeight: "1.48em",
          }}
        >
          {link.label}
        </Link>
      ))}
      <p
        className="font-medium text-xs"
        style={{
          lineHeight: "1.48em",
        }}
      >
        これは政党チームみらいが運営しているものではありません
      </p>
      <p
        className="font-medium text-xs"
        style={{
          lineHeight: "1.48em",
        }}
      >
        © 2026 みらいと維新の風
      </p>
    </div>
  );
}
