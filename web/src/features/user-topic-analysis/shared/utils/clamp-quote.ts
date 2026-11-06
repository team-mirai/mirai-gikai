/**
 * 引用文の切り詰め計算。
 *
 * ふりがな表示(rubyful)は `main` 配下の span/a などの innerHTML を丸ごと差し替える。
 * 実測して切り詰める実装だと差し替え後に ResizeObserver が発火し、React が
 * 消えたノードを removeChild しようとしてページごとエラーバウンダリに落ちた。
 * そのため描画前に確定できる文字数ベースの計算に寄せている。
 */

/**
 * 半角文字の幅。全角1文字を1として、Noto Serif JP 600 / 14px で実測した値。
 *
 *   A-Z 平均 0.714（W は 1.076）/ a-z 平均 0.573 / 0-9 0.567 / 記号・空白 0.25〜0.33
 *
 * ASCII を一律 0.5 とすると "DX"(0.725) や "WWW"(1.078) で足りない。
 * 少なく見積もると行が増えるので、実測より気持ち大きめに丸めている。
 */
const UPPERCASE_WIDTH = 0.75;
const ALPHANUMERIC_WIDTH = 0.6;
const SYMBOL_WIDTH = 0.4;
const HALF_WIDTH_KANA_WIDTH = 0.5;

/** 肩書は本文より小さい字なので、11px / 14px の比で本文の幅に換算する。 */
const ATTRIBUTION_FONT_RATIO = 11 / 14;

/** 肩書を囲う「（」「）」ぶん。 */
const PARENTHESES_WIDTH = 2;

/** 切り詰めたときに末尾へ付く「…」ぶん。 */
const ELLIPSIS_WIDTH = 1;

export type ClampedQuoteResult = {
  /** 表示する引用本文。「…」は含まない。 */
  text: string;
  /** 末尾に「…」を付けるか。 */
  truncated: boolean;
};

/** 文字1つぶんの見た目の幅。 */
function charWidth(char: string): number {
  const code = char.codePointAt(0) ?? 0;

  if (code >= 0xff61 && code <= 0xff9f) return HALF_WIDTH_KANA_WIDTH;
  // ASCII 以外はすべて全角として扱う（日本語の引用が対象のため）
  if (code > 0x7f) return 1;
  if (code >= 0x41 && code <= 0x5a) return UPPERCASE_WIDTH;
  if ((code >= 0x61 && code <= 0x7a) || (code >= 0x30 && code <= 0x39)) {
    return ALPHANUMERIC_WIDTH;
  }
  return SYMBOL_WIDTH;
}

/**
 * 全角1文字を1として、文字列の見た目の幅を数える。
 *
 * 描画に使う Noto Serif JP はプロポーショナルなので、これは字種ごとの平均を
 * 使った近似でしかない。日本語主体の引用では誤差は小さいが、ラテン文字が
 * 続く引用では数文字ぶんずれる。ずれても行が1行増えるだけで、肩書が
 * 消えることはない（clamped-quote.tsx を参照）。
 */
export function visualWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += charWidth(char);
  }
  return width;
}

/** 見た目の幅が width に収まるところまで切る。 */
function sliceToWidth(text: string, width: number): string {
  let used = 0;
  let sliced = "";
  // for...of はコードポイント単位で回る。サロゲートペアを割らない。
  for (const char of text) {
    const next = used + charWidth(char);
    if (next > width) break;
    used = next;
    sliced += char;
  }
  return sliced;
}

/**
 * 引用本文を、肩書を含めて capacity に収まる長さへ切り詰める。
 *
 * 肩書は切り詰めない。読み手にとって「誰の発言か」は本文の末尾より情報量が多く、
 * ここが消えるのが元の実装で起きていた不具合そのものだったため。
 */
export function clampQuote(
  quote: string,
  attribution: string,
  capacity: number
): ClampedQuoteResult {
  // 本文が無ければ切り詰めようがない。肩書だけで capacity を超えていても、
  // 「…」だけが残るような表示にはしない。
  if (quote === "") {
    return { text: "", truncated: false };
  }

  const attributionWidth =
    (visualWidth(attribution) + PARENTHESES_WIDTH) * ATTRIBUTION_FONT_RATIO;

  if (visualWidth(quote) + attributionWidth <= capacity) {
    return { text: quote, truncated: false };
  }

  const budget = Math.max(capacity - attributionWidth - ELLIPSIS_WIDTH, 0);
  return { text: sliceToWidth(quote, budget), truncated: true };
}
