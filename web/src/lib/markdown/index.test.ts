import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./index";

describe("parseMarkdown", () => {
  it("should not allow malicious iframe elements", async () => {
    const markdown = `<iframe src="https://malicious.com/evil" onload="alert('XSS')"></iframe>

https://www.youtube.com/watch?v=safe123`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // 悪意のあるiframeは削除され、YouTube埋め込みだけが残ることを確認
    expect(html).not.toContain("malicious.com");
    expect(html).not.toContain("onload");
    expect(html).toContain('src="https://www.youtube.com/embed/safe123"');
  });

  it("should render GFM tables", async () => {
    const markdown = `| 項目 | 内容 |
| --- | --- |
| 提出者 | 議員 |
| 状態 | 審議中 |`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<th>項目</th>");
    expect(html).toContain("<td>提出者</td>");
    expect(html).toContain("<td>審議中</td>");
  });

  it("should keep column alignment of GFM tables", async () => {
    const markdown = `| 左 | 中央 | 右 |
| :--- | :---: | ---: |
| a | b | c |`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // rehype-sanitizeのdefaultSchemaを通しても配置指定が残ることを確認
    expect(html).toContain("text-align:left");
    expect(html).toContain("text-align:center");
    expect(html).toContain("text-align:right");
  });

  it("should render GFM task lists as checkboxes", async () => {
    const markdown = `- [x] 一読目
- [ ] 二読目`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // rehype-sanitizeのdefaultSchemaはタスクリスト用のinputを許可している
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("disabled");
    expect(html).toContain("checked");
    expect(html).toContain("一読目");
    expect(html).toContain("二読目");
  });

  it("should render GFM strikethrough", async () => {
    const markdown = "~~取り下げ~~ された議案";

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    expect(html).toContain("<del>取り下げ</del>");
  });

  it("should still embed a bare YouTube URL turned into a link by GFM autolink", async () => {
    // remark-gfmのautolink literalは裸のURLを<a>要素に変換するため、
    // テキストノードだけを見る実装だと埋め込みが壊れる。その回帰を防ぐ。
    const markdown = `参考動画

https://www.youtube.com/watch?v=abc123`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    expect(html).toContain('src="https://www.youtube.com/embed/abc123"');
    expect(html).not.toContain('href="https://www.youtube.com/watch?v=abc123"');
  });

  it("should keep an explicitly labelled YouTube link as a link", async () => {
    const markdown = "[動画はこちら](https://www.youtube.com/watch?v=abc123)";

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // ラベル付きリンクは従来どおりリンクのまま（埋め込みに変えない）
    expect(html).toContain('href="https://www.youtube.com/watch?v=abc123"');
    expect(html).toContain("動画はこちら");
    expect(html).not.toContain("youtube.com/embed/");
  });
});
