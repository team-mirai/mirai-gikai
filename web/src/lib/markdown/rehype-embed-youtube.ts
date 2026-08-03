import type { Element, ElementContent, Root } from "hast";
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
 * テキストノードから行頭のYouTube URLを探してビデオIDを返す
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
 * 空白だけのテキストノードか
 */
function isBlankText(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

/**
 * リンク要素が行頭にある裸のURLか
 *
 * remark-gfmのautolink literalは裸のURLを<a>要素に変換するため、
 * テキストノードだけを見ていると埋め込みが成立しなくなる。
 * ただし段落をiframeで置き換える以上、周囲の文字を巻き添えで消さないよう、
 * 「行頭にある」「表示テキストがhrefと一致する」ものだけを対象にする。
 * 例えば「解説: <URL>」はリンクのまま残り、「解説:」が失われない。
 */
function isBareUrlAtLineStart(
  children: ElementContent[],
  index: number
): boolean {
  for (let i = index - 1; i >= 0; i--) {
    const previous = children[i];
    if (isBlankText(previous)) {
      continue;
    }
    // 直前が改行なら行頭とみなす（remarkBreaksがbr要素を挟む）
    return previous.type === "element" && previous.tagName === "br";
  }

  // 先行する要素が無ければ段落の先頭＝行頭
  return true;
}

/**
 * リンク要素からYouTube URLを探してビデオIDを返す
 */
function findYouTubeIdInLink(node: ElementContent): string | null {
  if (node.type !== "element" || node.tagName !== "a") {
    return null;
  }

  const href = node.properties?.href;
  if (typeof href !== "string" || !href.startsWith("https://")) {
    return null;
  }

  // 表示テキストがhrefと一致するもの（＝裸のURL由来）だけを対象にする。
  // 明示的に書かれた[ラベル](URL)形式のリンクは従来どおりリンクのまま残す。
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
        for (const [childIndex, child] of node.children.entries()) {
          let youtubeId: string | null = null;

          if (child.type === "text") {
            youtubeId = findYouTubeIdInText(child.value);
          } else if (isBareUrlAtLineStart(node.children, childIndex)) {
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
