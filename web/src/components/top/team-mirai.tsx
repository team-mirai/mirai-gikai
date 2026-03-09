import Image from "next/image";
import { ManualRuby } from "@/lib/rubyful/manual-ruby";
import { SOCIAL_LINKS } from "@/lib/social-links";
import { LinkButton } from "./link-button";

const TEAM_MIRAI_SNS_ORDER = [
  "youtube",
  "x",
  "line",
  "instagram",
  "facebook",
  "tiktok",
] as const;

export function TeamMirai() {
  return (
    <div className="py-10">
      <div className="flex flex-col gap-6">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4">
          <h2>
            <Image
              src="/icons/team-mirai-typography.svg"
              alt="Team Mirai"
              width={263}
              height={39}
              priority
            />
          </h2>
          <p className="text-sm font-bold text-primary-accent">
            チームみらいについて
          </p>
        </div>

        {/* コンテンツ */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] leading-[28px] text-black">
              参議院議員・AIエンジニアの
              <ManualRuby ruby="あんの">安野</ManualRuby>
              たかひろが立ち上げた政党です。テクノロジーで政治の課題を解決することを目指しています。
            </p>
          </div>

          {/* ボタングループ */}
          <div className="flex flex-col gap-4">
            <LinkButton
              href="https://team-mir.ai/"
              icon={{
                src: "/icons/info-icon.svg",
                alt: "",
                width: 23,
                height: 22,
              }}
            >
              チームみらいについて詳しく
            </LinkButton>

            <LinkButton
              href="https://team-mir.ai/#donation"
              icon={{
                src: "/icons/heart-icon.svg",
                alt: "",
                width: 18,
                height: 17,
              }}
            >
              寄附で応援する
            </LinkButton>
          </div>

          {/* SNSアイコン */}
          <div className="flex flex-wrap gap-3 items-end">
            {TEAM_MIRAI_SNS_ORDER.map((key) => {
              const sns = SOCIAL_LINKS[key];
              return (
                <a
                  key={key}
                  href={sns.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  <Image
                    src={sns.iconPath}
                    alt={sns.name}
                    width={48}
                    height={48}
                    className={
                      sns.hasBorder
                        ? "rounded-full border border-mirai-border-light"
                        : ""
                    }
                  />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
