/**
 * チームみらいの賛否（type / 判断の理由）が公開済みかどうかを判定する。
 *
 * is_published が false（手動で非公開）なら公開日時に関わらず非公開。
 * publish_at が未設定（null）なら即時公開扱い。設定されている場合は
 * その日時以降のみ公開とし、それより前は公開側で「未設定」として扱う。
 */
export function isMiraiStancePublished(
  stance: { is_published: boolean; publish_at: string | null },
  now: Date
): boolean {
  if (!stance.is_published) return false;
  if (stance.publish_at === null) return true;
  const publishTime = new Date(stance.publish_at).getTime();
  // 不正な日時は公開してしまうより非公開に倒す
  if (Number.isNaN(publishTime)) return false;
  return publishTime <= now.getTime();
}
