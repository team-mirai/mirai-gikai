/**
 * チームみらいの賛否の「判断の理由」のフォーマット判定と補足情報の取り扱い。
 *
 * - 新フォーマット: reason_summary（一言）+ reason_points（箇条書き）+ supplements（補足情報）
 * - 旧フォーマット: comment（自由記述）
 *
 * 公開側は新フォーマットのデータがあればそちらを、なければ旧フォーマットを表示する。
 */

export type StanceSupplement = {
  title: string;
  /** Markdown */
  body: string;
};

// マイグレーション前にキャッシュされたデータではカラム自体が存在しないため optional にする
type NewFormatReasonFields = {
  reason_summary?: string | null;
  reason_points?: string[] | null;
};

/**
 * 新フォーマットの判断の理由（一言・箇条書き）を表示用に整形する。
 * どちらも空なら null（旧フォーマットで表示する）。補足情報だけでは新フォーマットとみなさない。
 */
export function getNewFormatReason(
  stance: NewFormatReasonFields
): { summary: string; points: string[] } | null {
  const summary = stance.reason_summary?.trim() ?? "";
  const points = normalizeReasonPoints(stance.reason_points ?? []);
  if (summary === "" && points.length === 0) return null;
  return { summary, points };
}

/** 新フォーマットの判断の理由（一言または箇条書き）が入力されているか */
export function hasNewFormatReason(stance: NewFormatReasonFields): boolean {
  return getNewFormatReason(stance) !== null;
}

/**
 * DB の supplements（jsonb）を StanceSupplement[] に変換する。
 * 想定外の形の要素は読み飛ばす。
 */
export function parseStanceSupplements(value: unknown): StanceSupplement[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { title, body } = item as Record<string, unknown>;
    return [
      {
        title: typeof title === "string" ? title : "",
        body: typeof body === "string" ? body : "",
      },
    ];
  });
}

/** 見出し・本文ともに空の補足情報を取り除き、前後の空白を整える */
export function normalizeStanceSupplements(
  supplements: StanceSupplement[]
): StanceSupplement[] {
  return supplements
    .map(({ title, body }) => ({ title: title.trim(), body: body.trim() }))
    .filter(({ title, body }) => title !== "" || body !== "");
}

/** 空の項目を取り除き、前後の空白を整える */
export function normalizeReasonPoints(points: string[]): string[] {
  return points.map((point) => point.trim()).filter((point) => point !== "");
}

/**
 * 公開サイトに表示する補足情報。
 * 見出しだけで本文が空のもの（採決前の「各議員の判断」など）は表示しない。
 */
export function getDisplayableSupplements(value: unknown): StanceSupplement[] {
  return normalizeStanceSupplements(parseStanceSupplements(value)).filter(
    ({ body }) => body !== ""
  );
}
