import { splitTextByQuery } from "../../shared/utils/split-text-by-query";

interface HighlightedTextProps {
  text: string;
  query: string;
}

/**
 * テキスト内の検索語一致箇所を <mark> でハイライト表示する。
 */
export function HighlightedText({ text, query }: HighlightedTextProps) {
  const segments = splitTextByQuery(text, query);

  // key には各セグメントのテキスト先頭位置（文字オフセット）を使う
  let offset = 0;
  return (
    <>
      {segments.map((segment) => {
        const key = offset;
        offset += segment.text.length;
        return segment.isMatch ? (
          <mark key={key} className="bg-yellow-200 rounded-sm px-0.5">
            {segment.text}
          </mark>
        ) : (
          <span key={key}>{segment.text}</span>
        );
      })}
    </>
  );
}
