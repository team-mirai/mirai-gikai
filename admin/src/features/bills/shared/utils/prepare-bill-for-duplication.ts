import type { Bill, BillInsert } from "../types";

/**
 * 議案データから複製用のinsertデータを生成する
 * ID・タイムスタンプを除去し、名前に「(複製)」を付与、ステータスをdraftに設定
 */
export function prepareBillForDuplication(originalBill: Bill): BillInsert {
  const {
    id: _,
    created_at: __,
    updated_at: ___,
    ...billWithoutId
  } = originalBill;

  return {
    ...billWithoutId,
    name: `${originalBill.name} (複製)`,
    publish_status: "draft",
  };
}

/**
 * 議案コンテンツ配列から複製用のデータを生成する
 * IDを除去し、新しいbill_idを設定
 */
export function prepareBillContentsForDuplication<
  T extends { id: string; bill_id: string },
>(
  contents: T[],
  newBillId: string
): (Omit<T, "id" | "bill_id"> & { bill_id: string })[] {
  return contents.map((content) => {
    const { id: _, bill_id: __, ...contentData } = content;
    return {
      ...contentData,
      bill_id: newBillId,
    };
  });
}
