import { getMessageDisplayText } from "@/features/interview-report/shared/utils/get-message-display-text";
import type { OpenDataMessage } from "../types/open-data";

/**
 * DBに保存されたメッセージ行を公開APIのメッセージ形式に変換する。
 *
 * assistant の content は構造化JSONの生文字列で保存されており、最終ターンには
 * 内部メタデータ（report・content_richness 等）が埋め込まれる。webの公開ページと
 * 同じ表示テキスト抽出（getMessageDisplayText）を適用することで、
 * 「APIで取得できる内容 = みらい議会上で公開されている内容」を関数レベルで保証する。
 * user の content はwebと同様にそのまま返す。
 */
export function toOpenDataMessage(row: {
  role: OpenDataMessage["role"];
  content: string;
}): OpenDataMessage {
  return {
    role: row.role,
    content:
      row.role === "assistant"
        ? getMessageDisplayText(row.content)
        : row.content,
  };
}
