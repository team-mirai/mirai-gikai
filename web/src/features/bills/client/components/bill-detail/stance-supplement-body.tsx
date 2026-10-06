import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { rehypeExternalLinks } from "@/lib/markdown/rehype-external-links";
import { emphasizeListItemLabels } from "../../../shared/utils/emphasize-list-item-labels";

interface StanceSupplementBodyProps {
  markdown: string;
}

/** 補足情報の本文（Markdown）。箇条書き・表などを補足情報用の文字サイズで表示する */
export function StanceSupplementBody({ markdown }: StanceSupplementBodyProps) {
  return (
    <div className="flex flex-col gap-2.5 text-sm leading-[26px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeExternalLinks]}
        components={{
          p: ({ children }) => <p className="m-0 text-pretty">{children}</p>,
          ul: ({ children }) => (
            <ul className="m-0 flex list-disc flex-col gap-2.5 pl-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="m-0 flex list-decimal flex-col gap-2.5 pl-5">
              {children}
            </ol>
          ),
          strong: ({ children }) => (
            <strong className="font-bold leading-[1.6]">{children}</strong>
          ),
          a: ({ node: _node, ...props }) => (
            <a {...props} className="text-primary-accent underline" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse overflow-hidden rounded-lg bg-white text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-mirai-border px-3 py-1.5 text-left font-bold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-mirai-border px-3 py-1.5">
              {children}
            </td>
          ),
        }}
      >
        {emphasizeListItemLabels(markdown)}
      </ReactMarkdown>
    </div>
  );
}
