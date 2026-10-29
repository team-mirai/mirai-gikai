/**
 * 賛否の書き込みで、非公開（または未登録）から公開に切り替わるかを判定する。
 * 賛否が決まった議案は意見を集める必要がないため、公開に切り替わるときに公開中のインタビューを閉じる。
 *
 * @param wasPublished 書き込み前の is_published。賛否が未登録なら null
 * @param inputIsPublished 書き込む isPublished。undefined は既存の値を保持し、新規作成なら DB の既定値（公開）になる
 */
export function isStanceBecomingPublished(
  wasPublished: boolean | null,
  inputIsPublished: boolean | undefined
): boolean {
  const willBePublished = inputIsPublished ?? wasPublished ?? true;
  return willBePublished && wasPublished !== true;
}
