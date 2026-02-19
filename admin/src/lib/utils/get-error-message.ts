/**
 * unknown型のエラーからメッセージを抽出する純粋関数。
 * catch句で受け取ったerrorの型安全な処理に使用する。
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
