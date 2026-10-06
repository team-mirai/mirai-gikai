/**
 * チームみらいの賛否（type / comment）が公開済みかどうかを判定する。
 *
 * publish_at が未設定（null）なら即時公開扱い。設定されている場合は
 * その日時以降のみ公開とし、それより前は公開側で「未設定」として扱う。
 */
export function isMiraiStancePublished(
  publishAt: string | null,
  now: Date
): boolean {
  if (publishAt === null) return true;
  const publishTime = new Date(publishAt).getTime();
  // 不正な日時は公開してしまうより非公開に倒す
  if (Number.isNaN(publishTime)) return false;
  return publishTime <= now.getTime();
}
