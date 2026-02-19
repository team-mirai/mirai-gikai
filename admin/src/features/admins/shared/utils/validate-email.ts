const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * メールアドレスのバリデーション
 * 無効な形式の場合にエラーメッセージを返す
 */
export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email)) {
    return "有効なメールアドレスを入力してください";
  }

  return null;
}
