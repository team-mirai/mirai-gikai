import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ReactElement } from "react";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { LongPressSection } from "@/features/bills/client/components/bill-detail/long-press-section";
import { DifficultyInfoCard } from "@/features/bills/server/components/bill-detail/difficulty-info-card";
import { rehypeEmbedYouTube } from "./rehype-embed-youtube";
import { rehypeExternalLinks } from "./rehype-external-links";
import { rehypeInjectElement } from "./rehype-inject-element";
import { rehypeWrapSections } from "./rehype-wrap-sections";

// rehypeSanitizeのスキーマをカスタマイズ
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), "target", "rel"],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // カスタム要素を許可
    "LongPressSection",
    "DifficultyInfoCard",
  ],
};

/**
 * MarkdownテキストをReact Elementに変換
 * @param markdown - Markdown形式のテキスト
 * @param options - オプション（currentLevel等）
 * @returns React Element（部分水和対応）
 */
export async function parseMarkdown(markdown: string): Promise<ReactElement> {
  // Markdown → mdast
  const mdast = unified().use(remarkParse).use(remarkBreaks).parse(markdown);

  // mdast → hast（rehypeプラグイン適用）
  const hast = await unified()
    .use(remarkRehype)
    .use(rehypeWrapSections)
    .use(rehypeInjectElement, {
      injections: [
        {
          targetH2Index: 3,
          tagName: "LongPressSection",
        },
        {
          targetH2Index: -1,
          tagName: "DifficultyInfoCard",
        },
      ],
    })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeExternalLinks)
    .use(rehypeEmbedYouTube)
    .run(mdast);

  // hast → React Element（部分水和）
  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: {
      LongPressSection, // Client Componentとして水和
      DifficultyInfoCard, // Client Componentとして水和
    },
  });
}
