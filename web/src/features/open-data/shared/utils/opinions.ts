export type OpenDataOpinion = {
  title: string;
  content: string;
};

/**
 * interview_report.opinions（JSONB）を公開API用の形に変換する。
 * title/content のみを返し、内部用のメタデータ（根拠メッセージID等）は含めない。
 * 配列でない・要素が不正な場合は握りつぶさず空要素を除外する。
 */
export function toOpenDataOpinions(value: unknown): OpenDataOpinion[] {
  if (!Array.isArray(value)) return [];

  const opinions: OpenDataOpinion[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const { title, content } = item as { title?: unknown; content?: unknown };
    if (typeof title !== "string" || typeof content !== "string") continue;
    opinions.push({ title, content });
  }
  return opinions;
}
