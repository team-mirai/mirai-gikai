/**
 * スラッグのバリデーション
 * 半角英小文字、数字、ハイフンのみ許可
 */
export function validateSlug(slug: string | null | undefined): string | null {
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return "スラッグは半角英小文字、数字、ハイフンのみ使用できます";
  }

  return null;
}
