import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeEmbedYouTube } from "./rehype-embed-youtube";

// テスト用のヘルパー関数：HTMLを正規化して比較しやすくする
function normalizeHTML(html: string): string {
  return html
    .replace(/>\s+</g, "><") // タグ間の空白文字を削除
    .replace(/\s+/g, " ") // 連続する空白文字を1つのスペースに変換
    .trim(); // 先頭と末尾の空白を削除
}

// YouTube埋め込み用のテストプロセッサー
const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeEmbedYouTube)
  .use(rehypeStringify);

describe("rehypeEmbedYouTube", () => {
  it("should convert YouTube URLs to iframe embeds", async () => {
    const input = `# YouTube動画

https://www.youtube.com/watch?v=dQw4w9WgXcQ

その他のテキスト`;

    const result = await processor.process(input);
    const output = result.toString();

    const expected = `<h1>YouTube動画</h1>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>
<p>その他のテキスト</p>`;

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });

  it("should handle youtu.be short URLs", async () => {
    const input = `https://youtu.be/dQw4w9WgXcQ`;

    const result = await processor.process(input);
    const output = result.toString();

    const expected = `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>`;

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });

  it("should not convert non-YouTube URLs", async () => {
    const input = `https://example.com/video

普通のテキスト`;

    const result = await processor.process(input);
    const output = result.toString();

    const expected = `<p>https://example.com/video</p>
<p>普通のテキスト</p>`;

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });

  it("should handle multiple YouTube URLs", async () => {
    const input = `最初の動画：

https://www.youtube.com/watch?v=dQw4w9WgXcQ

2番目の動画：

https://youtu.be/jNQXAC9IVRw`;

    const result = await processor.process(input);
    const output = result.toString();

    const expected = `<p>最初の動画：</p>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>
<p>2番目の動画：</p>
<iframe src="https://www.youtube.com/embed/jNQXAC9IVRw" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>`;

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });

  it("should handle YouTube URL with query parameters", async () => {
    const input = `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s`;

    const result = await processor.process(input);
    const output = result.toString();

    const expected = `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>`;

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });
});

// remark-gfm有効時のプロセッサー（本番のparseMarkdownと同じくautolink literalが働く）
const gfmProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeEmbedYouTube)
  .use(rehypeStringify);

describe("rehypeEmbedYouTube with remark-gfm", () => {
  it("should embed a bare URL that gfm turned into a link", async () => {
    const input = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    const result = await gfmProcessor.process(input);
    const output = result.toString();

    const expected =
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>';

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });

  it("should keep a labelled link as a link", async () => {
    const input = "[動画はこちら](https://www.youtube.com/watch?v=dQw4w9WgXcQ)";

    const result = await gfmProcessor.process(input);
    const output = result.toString();

    const expected =
      '<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">動画はこちら</a></p>';

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });

  it("should not embed a link to a non-YouTube URL", async () => {
    const input = "https://example.com/video";

    const result = await gfmProcessor.process(input);
    const output = result.toString();

    const expected =
      '<p><a href="https://example.com/video">https://example.com/video</a></p>';

    expect(normalizeHTML(output)).toBe(normalizeHTML(expected));
  });
});
