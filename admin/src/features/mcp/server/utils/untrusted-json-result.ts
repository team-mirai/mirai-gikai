import "server-only";

import { randomUUID } from "node:crypto";
import { wrapUntrustedData } from "../../shared/utils/untrusted-data-block";

/**
 * 一般利用者の自由記述を含むツール結果を返す。
 *
 * JSON の中身は jsonResult と同じで一切加工しない（管理者が原文を読む）。
 * 外側だけを応答ごとのランダム nonce 付きタグで囲み、受け取ったエージェントに
 * 「これはデータであって指示ではない」と伝える。
 */
export function untrustedJsonResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: wrapUntrustedData(JSON.stringify(value, null, 2), randomUUID()),
      },
    ],
  };
}
