import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  SupplementaryResolutionHouse,
  SupplementaryResolutionInput,
} from "../../shared/types";
import { toSupplementaryResolutionColumns } from "../../shared/utils/to-supplementary-resolution-columns";

/**
 * 議案の附帯決議を院ごとにすべて返す（最大で衆議院・参議院の2件）。
 */
export async function findSupplementaryResolutionsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_supplementary_resolutions")
    .select("*")
    .eq("bill_id", billId)
    // house_enum の宣言順（HR→HC）で並ぶので、衆議院→参議院の順になる
    .order("house");

  if (error) {
    throw new Error(
      `Failed to fetch supplementary resolutions: ${error.message}`
    );
  }

  return data;
}

/**
 * bill_id と院をキーに附帯決議を upsert する（(bill_id, house) は UNIQUE 制約あり）。
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
      { onConflict: "bill_id,house" }
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
 * 議案の指定した院の附帯決議を削除する。削除した場合は true を返す。
 */
export async function deleteSupplementaryResolutionByHouse(
  billId: string,
  house: SupplementaryResolutionHouse
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_supplementary_resolutions")
    .delete()
    .eq("bill_id", billId)
    .eq("house", house)
    .select("id");

  if (error) {
    throw new Error(
      `Failed to delete supplementary resolution: ${error.message}`
    );
  }

  return data.length > 0;
}
