import "server-only";

import type { PromptBillInput } from "@mirai-gikai/shared/interview-prompts/types";
import { findBillContentsByBillId } from "@/features/bills-edit/server/repositories/bill-edit-repository";
import type { Bill } from "@/features/bills-edit/shared/types";

/**
 * プロンプトプレビュー用の Bill 情報を組み立てる。
 *
 * 実行時のインタビュー側では難易度が動的に切り替わるが、プレビューでは
 * シミュレーション側と揃えて "normal" 難易度のコンテンツを使用する。
 *
 * Bill 自体は呼び出し側で既に取得済みである前提で受け取り、bill_contents の
 * 取得のみ行う（同一リクエスト内での bill 重複取得を避けるため）。
 */
export async function getBillPromptInputForBill(
  bill: Bill
): Promise<PromptBillInput> {
  try {
    const contents = await findBillContentsByBillId(bill.id);
    const normalContent = contents.find((c) => c.difficulty_level === "normal");
    return {
      name: bill.name,
      bill_content: normalContent
        ? {
            title: normalContent.title,
            summary: normalContent.summary,
            content: normalContent.content,
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to fetch bill contents for prompt preview:", error);
    return { name: bill.name, bill_content: null };
  }
}
