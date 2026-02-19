/**
 * プレビューURLを構築する
 * @param webUrl - WebアプリのベースURL
 * @param path - プレビューパス（例: "/preview/bills/123" や "/preview/bills/123/interview"）
 * @param token - プレビュートークン
 */
export function buildPreviewUrl(
  webUrl: string,
  path: string,
  token: string
): string {
  return `${webUrl}${path}?token=${token}`;
}
