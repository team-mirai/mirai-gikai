/**
 * プレビューURLを構築する
 * @param webUrl - WebアプリのベースURL
 * @param path - プレビューパス（例: "/preview/bills/123" や "/preview/bills/123/interview"）
 * @param token - プレビュートークン
 * @param extraParams - 追加で付与するクエリパラメータ（値が空文字/undefinedのものはスキップ）
 */
export function buildPreviewUrl(
  webUrl: string,
  path: string,
  token: string,
  extraParams?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams({ token });
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  return `${webUrl}${path}?${params.toString()}`;
}
