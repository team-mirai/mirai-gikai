import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

/**
 * すべてのリンクにtarget="_blank"とrel="noopener noreferrer"を追加するrehypeプラグイン
 */
export function rehypeOpenLinksInNewTab() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a" && node.properties?.href) {
        node.properties.target = "_blank";
        node.properties.rel = "noopener noreferrer";
      }
    });
  };
}
