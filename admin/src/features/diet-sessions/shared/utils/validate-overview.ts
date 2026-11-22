const MAX_OVERVIEW_LENGTH = 500;

export function validateOverview(overview: string | null): string | null {
  if (overview !== null && overview.length > MAX_OVERVIEW_LENGTH) {
    return `説明文は${MAX_OVERVIEW_LENGTH}文字以内で入力してください`;
  }

  return null;
}
