export interface SocialLink {
  name: string;
  url: string;
  iconPath: string;
  hasBorder: boolean;
}

export const SOCIAL_LINKS: Record<string, SocialLink> = {
  web: {
    name: "Web",
    url: "https://team-mir.ai/",
    iconPath: "/icons/sns/icon_web.svg",
    hasBorder: false,
  },
  youtube: {
    name: "YouTube",
    url: "https://www.youtube.com/@team_mirai_jp",
    iconPath: "/icons/sns/icon_youtube.png",
    hasBorder: false,
  },
  x: {
    name: "X",
    url: "https://x.com/team_mirai_jp",
    iconPath: "/icons/sns/icon_x.png",
    hasBorder: false,
  },
  line: {
    name: "LINE",
    url: "https://lin.ee/aVvgk9jN",
    iconPath: "/icons/sns/icon_line.png",
    hasBorder: false,
  },
  instagram: {
    name: "Instagram",
    url: "https://www.instagram.com/team_mirai_jp/",
    iconPath: "/icons/sns/icon_instagram.png",
    hasBorder: true,
  },
  facebook: {
    name: "Facebook",
    url: "https://www.facebook.com/teammirai.official",
    iconPath: "/icons/sns/icon_facebook.png",
    hasBorder: false,
  },
  tiktok: {
    name: "TikTok",
    url: "https://www.tiktok.com/@team_mirai_jp",
    iconPath: "/icons/sns/icon_tiktok.png",
    hasBorder: true,
  },
  note: {
    name: "note",
    url: "https://note.com/team_mirai_jp",
    iconPath: "/icons/sns/icon_note.png",
    hasBorder: true,
  },
  threads: {
    name: "Threads",
    url: "https://www.threads.com/@team_mirai_jp",
    iconPath: "/icons/sns/icon_threads.png",
    hasBorder: false,
  },
};

export const getSocialLinksArray = (): Array<SocialLink & { key: string }> =>
  Object.entries(SOCIAL_LINKS).map(([key, link]) => ({
    ...link,
    key,
  }));
