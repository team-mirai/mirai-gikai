import { type ClampedQuoteResult, clampQuote } from "../utils/clamp-quote";

/**
 * 4行に収まる見た目の幅（全角換算・開き引用符「“」と「…」と肩書を含む）。
 * 本番のトピックカードで、画面幅ごとに引用ボックスの実寸から測った値。
 *
 *   viewport 320px → ボックス 230px → 61.5   ← NARROW をここに合わせる
 *   viewport 360px → ボックス 270px → 73.1
 *   viewport 500px → ボックス 379px → 105.1
 *   viewport 700px → ボックス 579px → 156.1  ← WIDE をここに合わせる
 *   viewport 2560px → ボックス 578px → 156.1
 *
 * ボックス幅は viewport 700px 付近で頭打ちになり、それ以上広げても変わらない。
 * そのため広い側（md: 以上）は端末によらずほぼ一定で、過不足が出ない。
 * 狭い側はいちばん狭いところに合わせる。広い画面では行末が余るが、
 * 溢れて肩書が押し出されるより余る方が安全。
 *
 * md はこのプロジェクトでは 700px（globals.css の --breakpoint-md で
 * Tailwind の既定値 768px から上書きされている）。sm も 500px。
 */
const NARROW_CAPACITY = 60;
const WIDE_CAPACITY = 154;

/** テストが同じ前提で引用文を組み立てられるように公開する。 */
export const QUOTE_CAPACITY = {
  narrow: NARROW_CAPACITY,
  wide: WIDE_CAPACITY,
} as const;

interface ClampedQuoteProps {
  quote: string;
  /** 肩書ラベル（例: 育休経験者）。括弧と下線は本コンポーネントで付与する。 */
  attribution: string;
}

/**
 * 引用文を「肩書を含めて最大4行」に収める。
 * 4行を超える場合は本文を切り詰めて末尾に「…（肩書）」をインライン表示する。
 *
 * 切り詰めは描画前に確定させ、マウント後に DOM を測り直さない。
 * ふりがな表示(rubyful)がこの要素の innerHTML を差し替えるため、
 * 実測して state を更新すると React が消えたノードを触りに行って
 * ページごとエラーバウンダリに落ちる。詳細は clamp-quote.ts と
 * lib/rubyful/initializer.tsx を参照。
 *
 * 高さの上限（旧実装の `max-h-[88px] overflow-hidden`）は意図的に持たない。
 * 肩書は本文の後ろに来るので、CSSで切ると真っ先に肩書が消える。それは
 * 今回直した不具合そのものなので、`line-clamp` の類も足さないこと。
 * 文字数の見積もりが外れたときは、行が1行増えるだけで済ませる。
 */
export function ClampedQuote({ quote, attribution }: ClampedQuoteProps) {
  const narrow = clampQuote(quote, attribution, NARROW_CAPACITY);
  const wide = clampQuote(quote, attribution, WIDE_CAPACITY);

  return (
    <span
      key={JSON.stringify([quote, attribution])}
      className="block font-mirai-serif text-[14px] font-semibold leading-[22px] text-mirai-text"
    >
      <span className="mr-1 align-[-0.1em] text-[18px] text-primary-accent">
        “
      </span>
      <span className="md:hidden">
        <QuoteBody result={narrow} />
      </span>
      <span className="hidden md:inline">
        <QuoteBody result={wide} />
      </span>
      <span className="ml-1 whitespace-nowrap text-[11px] text-primary-accent">
        （<span className="underline">{attribution}</span>）
      </span>
    </span>
  );
}

/**
 * 「…」は条件付きの子要素にせず本文と同じ文字列に混ぜる。
 * 子要素を出し入れすると、rubyful に innerHTML を差し替えられた後で
 * React が消えたノードを removeChild しようとして落ちる。
 */
function QuoteBody({ result }: { result: ClampedQuoteResult }) {
  return (
    <span className="hover:underline">
      {result.truncated ? `${result.text}…` : result.text}
    </span>
  );
}
