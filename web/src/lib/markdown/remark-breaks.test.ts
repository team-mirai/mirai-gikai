import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

/**
 * remarkBreaksが正しく適用されることを検証するテスト。
 * .parse()だけではトランスフォーマーが実行されないため、
 * .run()も呼び出す必要がある。
 */
describe("remarkBreaks", () => {
  it("blockquote内の連続行が<br>で改行される", async () => {
    const input = `> いつも使う児童生徒は「授業内容がよく分かっている」
> １年間デジタル教科書を使うと学力調査の得点が向上した
> アクセシビリティ機能により学習上の困難さを低減`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkBreaks)
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const output = result.toString();

    expect(output).toContain("<br>");
    expect(output).toContain("<blockquote>");
  });

  it("通常テキストの連続行も<br>で改行される", async () => {
    const input = `1行目
2行目
3行目`;

    const processor = unified()
      .use(remarkParse)
      .use(remarkBreaks)
      .use(remarkRehype)
      .use(rehypeStringify);

    const result = await processor.process(input);
    const output = result.toString();

    expect(output).toContain("<br>");
  });

  it("parse()のみではremarkBreaksが適用されない（従来の問題）", () => {
    const input = `> 1行目
> 2行目`;

    // parse()だけではトランスフォーマーは実行されない
    const processor = unified().use(remarkParse).use(remarkBreaks);
    const mdast = processor.parse(input);

    // mdastにはbreakノードが含まれない（softBreakのまま）
    const blockquote = mdast.children[0];
    expect(blockquote.type).toBe("blockquote");
    if (blockquote.type === "blockquote") {
      const paragraph = blockquote.children[0];
      if (paragraph.type === "paragraph") {
        const hasBreak = paragraph.children.some(
          (child: { type: string }) => child.type === "break"
        );
        expect(hasBreak).toBe(false);
      }
    }
  });

  it("run()を呼ぶとremarkBreaksが適用される（修正後の動作）", async () => {
    const input = `> 1行目
> 2行目`;

    const processor = unified().use(remarkParse).use(remarkBreaks);
    const parsed = processor.parse(input);
    // biome-ignore lint/suspicious/noExplicitAny: mdast node types need runtime type narrowing
    const mdast = (await processor.run(parsed)) as any;

    // run()後はbreakノードが含まれる
    const blockquote = mdast.children[0];
    expect(blockquote.type).toBe("blockquote");
    if (blockquote.type === "blockquote") {
      const paragraph = blockquote.children[0];
      if (paragraph.type === "paragraph") {
        const hasBreak = paragraph.children.some(
          (child: { type: string }) => child.type === "break"
        );
        expect(hasBreak).toBe(true);
      }
    }
  });
});
