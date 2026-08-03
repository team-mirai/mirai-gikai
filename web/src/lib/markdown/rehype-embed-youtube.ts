import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

/**
 * YouTube URLからビデオIDを抽出する
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * テキストノードからYouTube URLを探してビデオIDを返す
 */
function findYouTubeIdInText(text: string): string | null {
  for (const line of text.split("\n")) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("https://")) {
      const youtubeId = extractYouTubeId(trimmedLine);
      if (youtubeId) {
        return youtubeId;
      }
    }
  }

  return null;
}

/**
 * リンク要素からYouTube URLを探してビデオIDを返す
 *
 * remark-gfmのautolink literalによって裸のURLが<a>要素に変換されるため、
 * テキストノードだけを見ていると埋め込みが成立しなくなる。
 * 表示テキストがhrefと一致するもの（＝裸のURL由来）だけを対象にして、
 * 明示的に書かれた[ラベル](URL)形式のリンクは従来どおりリンクのまま残す。
 */
function findYouTubeIdInLink(node: Element): string | null {
  if (node.tagName !== "a") {
    return null;
  }

  const href = node.properties?.href;
  if (typeof href !== "string" || !href.startsWith("https://")) {
    return null;
  }

  const [child] = node.children;
  if (node.children.length !== 1 || child.type !== "text") {
    return null;
  }

  if (child.value.trim() !== href.trim()) {
    return null;
  }

  return extractYouTubeId(href);
}

/**
 * YouTube URLをiframeに変換するrehypeプラグイン
 */
export function rehypeEmbedYouTube() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "p" && parent && typeof index === "number") {
        // p要素の中のテキストノードとリンク要素をチェック
        for (const child of node.children) {
          let youtubeId: string | null = null;

          if (child.type === "text") {
            youtubeId = findYouTubeIdInText(child.value);
          } else if (child.type === "element") {
            youtubeId = findYouTubeIdInLink(child);
          }

          if (youtubeId) {
            // YouTube URLを見つけた場合、iframe要素に置き換え
            const iframe: Element = {
              type: "element",
              tagName: "iframe",
              properties: {
                src: `https://www.youtube.com/embed/${youtubeId}`,
                frameborder: "0",
                allow:
                  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                allowfullscreen: true,
                className: ["youtube-embed"],
              },
              children: [],
            };

            // p要素をiframe要素に置き換え
            parent.children[index] = iframe;
            return;
          }
        }
      }
    });
  };
}
