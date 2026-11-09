import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { SupplementaryResolutionInput } from "../../shared/types";
import { toSupplementaryResolutionColumns } from "../../shared/utils/to-supplementary-resolution-columns";

export async function findSupplementaryResolutionByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_supplementary_resolutions")
    .select("*")
    .eq("bill_id", billId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to fetch supplementary resolution: ${error.message}`
    );
  }

  return data;
}

/**
 * bill_id をキーに附帯決議を upsert する（bill_id は UNIQUE 制約あり）。
 * 保存後の行を返す。
 */
export async function upsertSupplementaryResolution(
  billId: string,
  input: SupplementaryResolutionInput
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_supplementary_resolutions")
    .upsert(
      {
        bill_id: billId,
        ...toSupplementaryResolutionColumns(input),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bill_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to upsert supplementary resolution: ${error.message}`
    );
  }

  return data;
}

/**
 * 議案の附帯決議を削除する。削除した場合は true を返す。
 */
export async function deleteSupplementaryResolutionByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_supplementary_resolutions")
    .delete()
    .eq("bill_id", billId)
    .select("id");

  if (error) {
    throw new Error(
      `Failed to delete supplementary resolution: ${error.message}`
    );
  }

  return data.length > 0;
}
