/**
 * タグ操作におけるDBエラーコードを日本語メッセージに変換する純粋関数。
 */

type DbError = {
  code: string;
  message: string;
};

type TagOperation = "作成" | "更新" | "削除";

export function mapTagDbError(error: DbError, operation: TagOperation): string {
  if (error.code === "23505") {
    return "このタグ名は既に存在します";
  }
  if (error.code === "PGRST116") {
    return "タグが見つかりません";
  }
  return `タグの${operation}に失敗しました: ${error.message}`;
}
